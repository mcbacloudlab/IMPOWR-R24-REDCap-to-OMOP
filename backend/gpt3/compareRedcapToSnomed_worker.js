const { parentPort, workerData } = require("worker_threads");
const cosineSimilarity = require("compute-cosine-similarity");

// Connection URL
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });

const collectionName = "gpt3_snomed_embeddings10";
const snomedCollection = client
  .db("GPT3_Embeddings")
  .collection(collectionName);

const redcapLookupCollection = client
  .db("GPT3_Embeddings")
  .collection("gpt3_redcap_lookup_embeddings");

console.log("Collection used: " + collectionName);
let finalList = [];

function isEmptyObject(obj) {
  if (obj === null || obj === undefined) {
    return false;
  }
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

async function processChunk(
  redCapCollectionArray,
  snomedCollection,
  skip,
  limit,
  progress
) {
  console.log("Processing Document At:", skip);
  console.log("Processing Document To:", skip + limit);
  finalList = [];
  let snomedCursor, snomedChunk, redcapLookupArray;
  try {
    snomedCursor = snomedCollection.find({}).skip(skip).limit(limit);
    snomedChunk = await snomedCursor.toArray();
    redcapLookupArray = await redcapLookupCollection.find({}).toArray();
  } catch (error) {
    console.error("Error while retrieving data from MongoDB:", error);
  }

  for (const redCapDoc of redCapCollectionArray) {
    let redcapFieldLabel = redCapDoc.fieldLabel;
    let redcapEmbedding = redCapDoc.gpt3_data.data[0].embedding;
    let topResults = [];

    // Combine snomedChunk and redcapLookupArray
    const combinedData = [...snomedChunk, ...redcapLookupArray];
    console.log('combineddata', combinedData)
    for (const data of combinedData) {
      let dataEmbedding = data.gpt3_data.data[0].embedding;
      let dataText = data.snomed_text || data.matchingText;
      let dataID =
        (!isEmptyObject(data.snomed_id) && data.snomed_id) ||
        (!isEmptyObject(data.matchingID) && data.matchingID);
      let _redCapDoc = redCapDoc;

      topResults.push({
        redcapFieldLabel,
        snomedText: dataText,
        snomedID: dataID? dataID: '',
        similarity: cosineSimilarity(dataEmbedding, redcapEmbedding),
        extraData: _redCapDoc.obj,
      });
    }

    finalList.push(
      topResults.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
    );
    topResults = [];
  }
  return finalList;
}

async function processChunks(redCapCollectionArray, chunkSize, progress) {
  const count = await snomedCollection.countDocuments();
  // parentPort.postMessage( `Loading SNOMED Collection into memory (${count} documents)...`);
  parentPort.postMessage(`Total Documents: ${count}`);
  // console.log(`Loading SNOMED Collection into memory (${count} documents)...`);

  let skip = 0;
  const results = [];

  while (skip < count) {
    const limit = Math.min(chunkSize, count - skip);
    const finalList = await processChunk(
      redCapCollectionArray,
      snomedCollection,
      skip,
      limit,
      progress
    );
    results.push(...finalList);
    skip += limit;
  }
  // clean up and only return top 3
  // get unique values of redcapFieldLabel
  console.log('results!', results)

  // const fieldLabels = [
  //   ...new Set(
  //     results
  //       .flat()
  //       .map((item) => item.redcapFieldLabel + "-" + item.extraData.field_name)
  //   ),
  // ];

  // const filteredData = fieldLabels.reduce((acc, fieldLabel) => {
  //   const items = results
  //     .flat()
  //     .filter(
  //       (item) =>
  //         item.redcapFieldLabel + "-" + item.extraData.field_name === fieldLabel
  //     );

  //   items.sort((a, b) => b.similarity - a.similarity);
  //   acc.push(...items.slice(0, 3));
  //   return acc;
  // }, []);
  // parentPort.postMessage('filtering data down done' );
  // parentPort.postMessage({ log: filteredData.flat() });
  console.log('filtered data',  results.flat())
  setTimeout(() => {
    parentPort.postMessage({ endResult: results.flat() });
    parentPort.close();
    process.exit(0);
  }, 5000);
}

// start processing in chunks, second param is size of chunk, assists in errors from running out of memory
processChunks(workerData.redCapCollectionArray, 30000, workerData.progress);
