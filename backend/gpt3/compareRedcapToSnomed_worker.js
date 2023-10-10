const { parentPort, workerData } = require("worker_threads");
const cosineSimilarity = require("compute-cosine-similarity");
// Connection URL
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });
var pg_pool = require("../db/postgresqlConnection.cjs");

let totalDocuments = 0;
const redcapLookupCollection = client
  .db("GPT3_Embeddings")
  .collection("gpt3_redcap_lookup_embeddings");

const portionSize = 1000; // Adjust this value based on your use case

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
  redcapLookupArray // Add redcapLookupArray as an argument
) {
  let finalList = [];
  let snomedCursor, snomedChunk;
  try {
    snomedCursor = snomedCollection.find({}).skip(skip).limit(limit);
    snomedChunk = await snomedCursor.toArray();
  } catch (error) {
    console.error("Error while retrieving data from MongoDB:", error);
  }
  // console.log('wahat')
  // console.log('redcapColleciton', redCapCollectionArray)
  for (const redCapDoc of redCapCollectionArray) {
    // console.log("redcapDoc", redCapDoc);
    let redcapFieldLabel = redCapDoc.fieldLabel;
    // console.log('embedding', redCapDoc.gpt3_data)
    if (!redCapDoc.gpt3_data.data[0]) return;
    let redcapEmbedding = redCapDoc.gpt3_data.data[0].embedding;
    let topResults = [];

    // If skip is 0 (first iteration), include redcapLookupArray, otherwise, use snomedChunk only
    const combinedData =
      skip === 0 ? [...snomedChunk, ...redcapLookupArray] : snomedChunk;

    for (const data of combinedData) {
      let dataEmbedding = data.gpt3_data.data[0].embedding;
      let dataText = data.snomed_text || data.matchingText;
      let dataID =
        (!isEmptyObject(data.snomed_id) && data.snomed_id) ||
        (!isEmptyObject(data.matchingID) && data.matchingID);
      let _redCapDoc = redCapDoc;
      if (_redCapDoc.obj.name && _redCapDoc.obj.name == dataID) {
        topResults.push({
          redcapFieldLabel,
          snomedText: dataText,
          snomedID: dataID ? dataID : "",
          similarity: 1,
          extraData: _redCapDoc.obj,
        });
      } else {
        topResults.push({
          redcapFieldLabel,
          snomedText: dataText,
          snomedID: dataID ? dataID : "",
          similarity: cosineSimilarity(dataEmbedding, redcapEmbedding),
          extraData: _redCapDoc.obj,
        });
      }
    }

    finalList.push(
      topResults.sort((a, b) => b.similarity - a.similarity).slice(0, 5)
    );
    topResults = [];
  }
  return finalList;
}

async function processChunks(
  redCapCollectionArray,
  chunkSize,
  progress,
  collectionsToUse
) {
  // Parse collectionsToUse from a JSON string to an array
  const collectionsArray = Object.keys(JSON.parse(collectionsToUse));
  console.log("Collection(s) used:", collectionsArray);
  // Map each collection name to a MongoDB collection
  const snomedCollections = collectionsArray.map((collectionName) =>
    client.db("GPT3_Embeddings").collection(collectionName)
  );

  // Initialize an empty array to store all results
  const allResults = [];

  // Process each collection
  for (const snomedCollection of snomedCollections) {
    const count = await snomedCollection.countDocuments();
    console.log(
      `Total Documents in ${snomedCollection.collectionName}: ${count}`
    );
    totalDocuments += count;
    let skip = 0;
    const results = [];
    const redcapLookupArray = await redcapLookupCollection.find({}).toArray();
    while (skip < count) {
      const limit = Math.min(chunkSize, count - skip);
      const finalList = await processChunk(
        redCapCollectionArray,
        snomedCollection,
        skip,
        limit,
        redcapLookupArray
      );
      results.push(...finalList);
      skip += limit;
    }

    // Add the results from this collection to allResults
    allResults.push(...results);
  }

  // console.log("Total Documents:", totalDocuments);
  // Now that all collections have been processed, we can sort and filter allResults
  const fieldLabels = [
    ...new Set(
      allResults.flat().map((item) => {
        let fieldName, fieldLabel;

        if (!item.extraData.field_name) fieldLabel = item.extraData.name;
        else fieldLabel = item.redcapFieldLabel;

        if (!item.redcapFieldLabel) fieldName = item.extraData.name;
        else fieldName = item.extraData.field_name;

        return fieldLabel + "-" + fieldName;
      })
    ),
  ];

  // console.log("field labels", fieldLabels);

  const filteredData = await fieldLabels.reduce(
    async (accPromise, combinedLabel) => {
      const acc = await accPromise;

      const items = allResults.flat().filter((item) => {
        let fieldName, fieldLabel;

        if (!item.extraData.field_name) fieldLabel = item.extraData.name;
        else fieldLabel = item.redcapFieldLabel;

        if (!item.redcapFieldLabel) fieldName = item.extraData.name;
        else fieldName = item.extraData.field_name;

        return fieldLabel + "-" + fieldName === combinedLabel;
      });

      items.sort((a, b) => b.similarity - a.similarity);

      const topItems = items.slice(0, 5);
      for (const item of topItems) {
        if (item.snomedID && typeof item.snomedID === "number") {
          const res = await pg_pool.query(
            "SELECT * FROM concept WHERE concept_id = $1",
            [item.snomedID]
          );
          if (res.rows.length > 0) {
            item.extraData = { ...item.extraData, ...res.rows[0] };
          }
        } else {
          console.log("Warning: snomedID is undefined for item", item);
        }
      }

      acc.push(...topItems);
      return acc;
    },
    Promise.resolve([])
  );

  //now use filtered data to go to postgres db to get more data from concept table using concept ids

  setTimeout(() => {
    const totalDataPortions = Math.ceil(filteredData.length / portionSize);
    for (let i = 0; i < totalDataPortions; i++) {
      const start = i * portionSize;
      const end = start + portionSize;
      const dataPortion = filteredData.slice(start, end);
      parentPort.postMessage({
        dataPortion,
        portionIndex: i,
        totalDataPortions,
      });
    }
    // console.timeEnd("child worker done")
    parentPort.postMessage({ endResult: null }); // Signal the end of data transmission
    parentPort.close();
    process.exit(0);
  }, 5000);
}

// Catch any unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// start processing in chunks, second param is size of chunk, assists in errors from running out of memory
processChunks(
  workerData.redCapCollectionArray,
  30000,
  workerData.progress,
  workerData.collectionsToUse
);
