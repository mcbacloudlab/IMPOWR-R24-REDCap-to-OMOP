const MongoClient = require("mongodb").MongoClient;
var axios = require("axios");
const cheerio = require("cheerio");
const axiosThrottle = require("axios-request-throttle");
const { Worker } = require("worker_threads");
axiosThrottle.use(axios, { requestsPerSecond: 150 }); //UMLS API limit is 20 requests per second
require("dotenv").config();
// Connection URL
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });
let collectionsToUse
async function main() {
  console.log("Start comparing embeddings");
  await client.connect();
  console.info("Connected successfully to MongoDB server");
}

main().then(async () => {
  try {
    const { stdin } = process;
    console.log('process argv', process.argv)
    collectionsToUse = process.argv[3]
    console.log('collectionsToUse', JSON.parse(collectionsToUse))
    let inputData = "";

    stdin.setEncoding("utf8");
    // read the input data from stdin
    stdin.on("data", (chunk) => {
      // console.log('data', chunk)
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
    console.log('Got Redcap Embeddings from Mongo')
  

    const transformedData = await Promise.all(
      _jsonData.map(async (obj) => {
        // console.log("obj", obj);
        obj.field_label = cheerio.load(obj.field_label).text();
        //consider radio buttons using og_field_name
        const document = await redcapCollection.findOne({
          fieldLabel: obj.field_label,
          formName: obj.form_name,
          variableName: obj.og_field_name?obj.og_field_name:obj.field_name,
        });

 
        // Merge the properties of obj into document
        const mergedDocument = Object.assign({}, document, { obj });
        // console.log('merged doc', mergedDocument)
        return mergedDocument;
      })
    );

    const redCapCollectionArray = transformedData;
    console.info("Loaded Redcap Collection into memory");
    // console.log('collections to use', collectionsToUse)
    console.log("ObjectKeys", Object.keys(JSON.parse(collectionsToUse)))
    const snomedCollection = client
      .db("GPT3_Embeddings")
      .collection("gpt3_snomed_embeddings");
    const jobCompleteInfoResults = await getJobCompleteInfo(
      redCapCollectionArray
    );
    await startProcessing(
      redCapCollectionArray,
      snomedCollection,
      jobCompleteInfoResults
    );

    //close MongoDB conneciton
    client.close();
  }
});

async function getJobCompleteInfo(redCapCollectionArray) {
  // Access the jobCompleteInfo collection in the GPT3_Embeddings database
  const jobCompleteInfoCollection = client
    .db("GPT3_Embeddings")
    .collection("jobCompleteInfo");

  // Initialize an empty array to store the matched documents
  const result = [];

  // Get all documents from the jobCompleteInfo collection
  const documents = await jobCompleteInfoCollection.find({}).toArray();

  // Loop through the documents
  for (const doc of documents) {
    // Access the jobData array of objects
    const jobDataArray = JSON.parse(doc.jobData);

    // Loop through the jobData array
    for (const jobData of jobDataArray) {
      // Loop through the redCapCollectionArray
      for (const redCapObj of redCapCollectionArray) {
        // Compare the redcapFieldLabel in jobData with the fieldLabel in redCapObj
        if (jobData.redcapFieldLabel === redCapObj.fieldLabel) {
          // Add the document to the result array
          // result.push(jobData);

          // Exit the inner loop and move to the next document
          break;
        }
      }

      // If the document was added to the result array, exit the outer loop and move to the next document
      if (result.includes(doc)) {
        break;
      }
    }
  }

  // Do not close the connection here; close it in the calling function or at the end of your script

  // Return the matched documents
  return result;
}

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



async function startProcessing(
  redCapCollectionArray,
  snomedCollection,
  jobCompleteInfoResults
) {
  let numWorkers = require("os").cpus().length; // Get the number of available cores
  numWorkers = 1; //forced to set this to 1 to prevent out of memory errors
  console.log(`Chunking into ${numWorkers} workers`);
  const chunkSize = Math.ceil(redCapCollectionArray.length / numWorkers);
  const workers = [];
  const finalList = [];
  const receivedDataPortions = [];
  let receivedPortionCount = 0;
  let totalDataPortions = 0;
  const progress = { count: 0 };
  const startProcTime = Date.now();

  console.info(
    "Calculating top similarities between Redcap Text and SNOMED text..."
  );


  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const workerData = {
      redCapCollectionArray: redCapCollectionArray.slice(start, end),
      dbName: "GPT3_Embeddings",
      collectionsToUse: collectionsToUse,
      progress: progress,
    };
    const worker = new Worker("./gpt3/compareRedcapToSnomed_worker.js", {
      workerData,
    });
    workers.push(worker);

    worker.on("message", (message) => {
      if (message.log) {
        console.log("log", ...message.log);
      } else if (message.dataPortion) {
        // Handle each portion of data received from the worker
        receivedDataPortions[message.portionIndex] = message.dataPortion;
        receivedPortionCount++;
        totalDataPortions = message.totalDataPortions;
        if (receivedPortionCount === totalDataPortions) {
          // All data portions received, reassemble the portions
          finalList.push(...receivedDataPortions.flat());
          console.log("endResult. pushing final list");
        }
      } else {
        console.log(message);
      }
    });

    worker.on("error", (error) => {
      console.error("Child worker errored: " + error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  }

  // console.log("wait for child to exit");
  await Promise.all(
    workers.map((worker) => {
      return new Promise((resolve) => {
        worker.on("exit", (code) => {
          //return this data to the caller
          // console.log('writing to stdout')
          // console.log("finalList", finalList);
          // console.log("jobCompleteResults", jobCompleteInfoResults);
          const mergedAndModifiedList = mergeAndCountMatches(
            finalList,
            jobCompleteInfoResults
          );
          // console.log("Merged and modified list:", mergedAndModifiedList);
          const outputString =
            JSON.stringify({ endResult: mergedAndModifiedList });
          setTimeout(() => {
            process.stdout.write(outputString + '\n');
          }, 2000);

          // process.stdout.write({ endResult: JSON.stringify(finalList) + "\n" });
          resolve();
        });
      });
    })
  );


  //clear from memory
  redCapCollectionArray = [];
  // snomedCollectionArray = [];

  return finalList;
}

function mergeAndCountMatches(finalList, jobCompleteInfoResults) {
  // Initialize an empty array to store the merged and modified objects
  const mergedList = [];

  // Loop through the finalList
  for (const finalObj of finalList) {
    // Create a copy of the object to avoid modifying the original
    const newObj = { ...finalObj, userMatch: 0 };
    // Loop through the jobCompleteInfoResults
    for (const jobInfoObj of jobCompleteInfoResults) {
      // Compare the redcapFieldLabel in newObj and jobInfoObj
      if (
        newObj.redcapFieldLabel === jobInfoObj.redcapFieldLabel &&
        newObj.snomedID === jobInfoObj.snomedID &&
        jobInfoObj.selected === true
      ) {
        // Increment the userMatch value
        newObj.userMatch += 1;
      } else if (jobInfoObj.subRows && Array.isArray(jobInfoObj.subRows)) {
        // Loop through the subRows in jobInfoObj
        for (const subRow of jobInfoObj.subRows) {
          // Compare the redcapFieldLabel in newObj and subRow
          if (
            newObj.redcapFieldLabel === subRow.redcapFieldLabel &&
            newObj.snomedID === subRow.snomedID &&
            subRow.selected === true
          ) {
            // Increment the userMatch value
            newObj.userMatch += 1;
          }
        }
      } else if (
        newObj.redcapFieldLabel === jobInfoObj.redcapFieldLabel &&
        jobInfoObj.selected === true
      ) {
        // Merge newObj and jobInfoObj
        const mergedObj = { ...newObj, ...jobInfoObj };
        // Add the mergedObj to the mergedList and continue to the next iteration
        mergedList.push(mergedObj);
        continue;
      } else if (jobInfoObj.subRows && Array.isArray(jobInfoObj.subRows)) {
        // Loop through the subRows in jobInfoObj
        for (const subRow of jobInfoObj.subRows) {
          // Compare the redcapFieldLabel in newObj and subRow
          if (
            newObj.redcapFieldLabel === subRow.redcapFieldLabel &&
            subRow.selected === true
          ) {
            // Merge newObj and jobInfoObj
            const mergedObj = { ...newObj, ...subRow };
            // Add the mergedObj to the mergedList and continue to the next iteration
            mergedList.push(mergedObj);
            continue;
          }
        }
      }
    }

    // Add the newObj to the mergedList
    mergedList.push(newObj);
  }

  // Return the merged and modified array of objects
  return mergedList;
}
