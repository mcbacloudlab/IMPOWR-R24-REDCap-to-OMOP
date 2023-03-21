const { parentPort, workerData } = require("worker_threads");
const cosineSimilarity = require("compute-cosine-similarity");

// Connection URL
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });

const snomedCollection = client
  .db("GPT3_Embeddings")
  .collection("gpt3_snomed_embeddings30k");

let finalList = [];
async function processChunk(
  redCapCollectionArray,
  snomedCollection,
  skip,
  limit,
  progress
) {
  //do not add any console.logs here. these are captured in queueService.js and extra logs tend to mess up the progress reporting back
  console.log("Processing Document At:", skip);
  console.log("Processing Document To:", skip + limit);
  finalList = []; //clear between each chunk
  let snomedCursor, snomedChunk
  try {
    snomedCursor = snomedCollection.find({}).skip(skip).limit(limit);
    snomedChunk = await snomedCursor.toArray();
    // rest of your code here...
  } catch (error) {
    console.error("Error while retrieving data from MongoDB:", error);
  }
  
  // console.log('snomedChunk', snomedChunk)
  for (const redCapDoc of redCapCollectionArray) {
    if (!redCapDoc || !redCapDoc.gpt3_data || !redCapDoc.gpt3_data.data || redCapDoc.gpt3_data.data.length === 0) {
      continue;
    }

    let redcapFieldLabel = redCapDoc.fieldLabel;
    let redcapEmbedding = redCapDoc.gpt3_data.data[0].embedding;
    let topResults = [];
    for (const snomed of snomedChunk) {
      let snomedEmbedding = snomed.gpt3_data.data[0].embedding;
      let snomedText = snomed.snomed_text;
      let snomedID = snomed.snomed_id;
      let _redCapDoc = redCapDoc

      topResults.push({
        redcapFieldLabel,
        snomedText,
        snomedID,
        similarity: cosineSimilarity(snomedEmbedding, redcapEmbedding),
        extraData: _redCapDoc.obj
      });
    }

    finalList.push(
      topResults.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
    );
    topResults = []; //clear top results
  }

  return finalList;
}

async function processChunks(redCapCollectionArray, chunkSize, progress) {
  const count = await snomedCollection.countDocuments();
  // parentPort.postMessage( `Loading SNOMED Collection into memory (${count} documents)...`);
  parentPort.postMessage( `Total Documents: ${count}`);
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

  // console.log("Finished processing SNOMED Collection");
  //clean up and only return top 3
  // get unique values of redcapFieldLabel
  // parentPort.postMessage( results);
  const fieldLabels = [...new Set(results.flat().map((item) => item.redcapFieldLabel))];
  // parentPort.postMessage( fieldLabels);
  // filter the results based on the top 3 similarity values for each redcapFieldLabel
  const filteredData = fieldLabels.reduce((acc, fieldLabel) => {
    const items = results.flat().filter((item) => item.redcapFieldLabel === fieldLabel);
    items.sort((a, b) => b.similarity - a.similarity);
    acc.push(...items.slice(0, 3));
    return acc;
  }, []);
  // parentPort.postMessage('filtering data down done' );
  // parentPort.postMessage({ log: filteredData.flat() });

  parentPort.postMessage({ endResult: filteredData.flat() });
  parentPort.close();
  process.exit(0);
}

// console.log('start compare child');
processChunks(workerData.redCapCollectionArray, 30000, workerData.progress);
