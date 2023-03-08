const { parentPort, workerData } = require("worker_threads");
const cosineSimilarity = require("compute-cosine-similarity");

function processChunk(redCapCollectionArray, snomedCollectionArray, progress) {
  const finalList = [];

  for (const redCapDoc of redCapCollectionArray) {
    let redcapFieldLabel = redCapDoc.fieldLabel;
    let redcapEmbedding = redCapDoc.gpt3_data.data[0].embedding;
    let redCapKeys = {
      redCapFileName: redCapDoc.fileName,
      redCapFormName: redCapDoc.formName,
      redCapVariableName: redCapDoc.variableName,
    };
    const topResults = [];
    for (const snomed of snomedCollectionArray) {
      let snomedEmbedding = snomed.gpt3_data.data[0].embedding;
      let snomedText = snomed.snomed_text;
      let snomedID = snomed.snomed_id;

      topResults.push({
        redcapFieldLabel,
        redCapKeys,
        snomedText,
        snomedID,
        similarity: cosineSimilarity(snomedEmbedding, redcapEmbedding),
      });
    }

    // Update the progress counter
    parentPort.postMessage({ progress: 1 });

    finalList.push(
      topResults.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
    );
  }

  parentPort.postMessage(finalList);
}

processChunk(
  workerData.redCapCollectionArray,
  workerData.snomedCollectionArray,
  workerData.progress
);
