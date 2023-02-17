const { parentPort } = require('worker_threads');

// Define the function to be executed in the worker thread
async function workerFunction(pgResults, snomedDataCollection, startIndex, endIndex) {
  let snomedNotEmbeddedCount = 0;
  let snomedAlreadyEmbeddedCount = 0;
  let snomedToEmbedList = [];
  let totalWords = 0;
  for (let i = startIndex; i < endIndex; i++) {
    const elem = pgResults[i];
    try {
      let words = elem.concept_name.split(" ");
      const result = await snomedDataCollection.findOne({
        snomed_id: elem.concept_id,
      });
      if (!result) {
        totalWords += words.length;
        snomedNotEmbeddedCount++;
        snomedToEmbedList.push({
          snomed_id: elem.concept_id,
          snomed_text: elem.concept_name,
        });
      } else {
        snomedAlreadyEmbeddedCount++;
      }
    } catch (err) {
      console.error(err);
    }
  }
  // Send the results back to the main thread
  parentPort.postMessage({
    snomedNotEmbeddedCount,
    snomedAlreadyEmbeddedCount,
    snomedToEmbedList,
    totalWords,
  });
}

// Receive the data sent from the main thread
parentPort.on('message', ({ pgResults, snomedDataCollection, startIndex, endIndex }) => {
  workerFunction(pgResults, snomedDataCollection, startIndex, endIndex);
});
