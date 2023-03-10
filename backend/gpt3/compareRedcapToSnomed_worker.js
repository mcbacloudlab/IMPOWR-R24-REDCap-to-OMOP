const { parentPort, workerData } = require("worker_threads");
const cosineSimilarity = require("compute-cosine-similarity");

// Connection URL
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });

const snomedCollection = client
  .db("GPT3_Embeddings")
  .collection("gpt3_snomed_embeddings");

let finalList = [];
async function processChunk(
  redCapCollectionArray,
  snomedCollection,
  skip,
  limit,
  progress
) {
  console.log("process chunk");
  console.log("Processing Document At:", skip);
  console.log("Processing Document To:", skip + limit);
  finalList = []; //clear between each chunk
  const snomedCursor = snomedCollection.find({}).skip(skip).limit(limit);
  const snomedChunk = await snomedCursor.toArray();

  for (const redCapDoc of redCapCollectionArray) {
    if (!redCapDoc) continue;

    let redcapFieldLabel = redCapDoc.fieldLabel;
    let redcapEmbedding = redCapDoc.gpt3_data.data[0].embedding;
    let redCapKeys = {
      redcapFieldLabel: redCapDoc.fieldLabel,
      redCapFormName: redCapDoc.formName,
      redCapVariableName: redCapDoc.variableName,
    };
    let topResults = [];
    for (const snomed of snomedChunk) {
      let snomedEmbedding = snomed.gpt3_data.data[0].embedding;
      let snomedText = snomed.snomed_text;
      let snomedID = snomed.snomed_id;

      topResults.push({
        redcapFieldLabel,
        snomedText,
        snomedID,
        similarity: cosineSimilarity(snomedEmbedding, redcapEmbedding),
      });
    }

    finalList.push(
      topResults.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
    );
    topResults = []; //clear top results

    // console.log("topresults", topResults);
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
