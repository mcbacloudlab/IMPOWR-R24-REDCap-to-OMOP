const MongoClient = require("mongodb").MongoClient;
const cosineSimilarity = require("compute-cosine-similarity");
// var eDistance = require("euclidean-distance");
const ProgressBar = require("cli-progress");
const Excel = require("exceljs");
var axios = require("axios");
const axiosThrottle = require("axios-request-throttle");
axiosThrottle.use(axios, { requestsPerSecond: 150 }); //UMLS API limit is 20 requests per second
require("dotenv").config();
// Connection URL
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });

async function main() {
  console.log("Start comparing embeddings");
  await client.connect();
  console.info("Connected successfully to MongoDB server");
}

main().then(async () => {
  try {
    const { stdin } = process;

    let inputData = "";

    stdin.setEncoding("utf8");
    // read the input data from stdin
    stdin.on("data", (chunk) => {
      inputData += chunk;
    });
    // parse the input data as JSON
    stdin.on("end", async () => {
      const jsonData = JSON.parse(inputData);
      // console.log("json data", jsonData);
      await processJsonData(jsonData);
    });
  } catch (error) {
    console.error(`Error embedding REDCap data: ${error}`);
    process.exit(1);
  }

  async function processJsonData(jsonData) {
    // console.log("jsondata", JSON.parse(jsonData));
    let _jsonData = JSON.parse(jsonData);

    //Load MongoDB Collections into memory/arrays
    const redcapCollection = client
      .db("GPT3_Embeddings")
      .collection("gpt3_redcap_embeddings");

    const transformedData = await Promise.all(
      _jsonData.map(async (obj) => {
        const document = await redcapCollection.findOne({
          fieldLabel: obj.field_label,
          formName: obj.form_name,
          variableName: obj.field_name,
        });
        return document;
      })
    );

    const redCapCollectionArray = transformedData;
    console.info("Loaded Redcap Collection into memory");
    const snomedCollection = client
      .db("GPT3_Embeddings")
      .collection("gpt3_snomed_embeddings30k");

    await startProcessing(
      redCapCollectionArray,
      snomedCollection
    );

    //close MongoDB conneciton
    client.close();


  }
});

async function loadCollection(collection) {
  return new Promise((resolve, reject) => {
    let collectionArray = [];
    // Code to load the entire collection into the array
    collection.find().toArray((error, docs) => {
      if (error) {
        reject(error);
      } else {
        collectionArray = docs;
        resolve(collectionArray);
      }
    });
  });
}

const { Worker } = require("worker_threads");

async function startProcessing(redCapCollectionArray, snomedCollection) {
  let numWorkers = require("os").cpus().length; // Get the number of available cores
  numWorkers = 1; //forced to set this to 1 to prevent out of memory errors
  console.log(`Chunking into ${numWorkers} workers`);
  const chunkSize = Math.ceil(redCapCollectionArray.length / numWorkers);
  const workers = [];
  const finalList = [];
  const progress = { count: 0 };
  const startProcTime = Date.now();

  console.info(
    "Calculating top similarities between Redcap Text and SNOMED text..."
  );
  let barTotal = redCapCollectionArray.length;
  const bar = new ProgressBar.Bar(
    {
      format:
        "Processing... |{bar}| {percentage}% |  ETA: {eta}s  | {value}/{total}",
    },
    ProgressBar.Presets.shades_classic
  );
  bar.start(barTotal, 0);

  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const workerData = {
      redCapCollectionArray: redCapCollectionArray.slice(start, end),
      dbName: "GPT3_Embeddings",
      collectionName: "gpt3_snomed_embeddings",
      progress: progress,
    };
    const worker = new Worker("./gpt3/compareRedcapToSnomed_worker.js", {
      workerData,
    });
    workers.push(worker);

    worker.on("message", (message) => {
      
      if (message.log) {
        console.log('log', ...message.log)
      } else if(message.endResult){
        console.log('endResult. pushing final list')
        finalList.push(...message.endResult);
      }else{
        console.log('generic', message)
      }
    });

    worker.on("error", (error) => {
      console.error('Child worker erroreed: ' + error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  }

  console.log('wait for child to exit')
  await Promise.all(
    workers.map((worker) => {
      return new Promise((resolve) => {
        worker.on("exit", (code) => {
          //return this data to the caller
          // console.log('writing to stdout')
          process.stdout.write(JSON.stringify(finalList) + "\n");
          resolve()
        });
      });
    })
  );

  // const totalProcTime = Date.now() - startProcTime;
  // console.log("Total processing time:", totalProcTime / 1000 + " secs");

  // console.log(
  //   "Average time per REDCap question: ",
  //   totalProcTime / redCapCollectionArray.length / 1000 + " secs"
  // );
  redCapCollectionArray = [];
  // snomedCollectionArray = [];

  return finalList;
}