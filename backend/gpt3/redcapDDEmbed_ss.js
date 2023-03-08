const MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const prompts = require("prompts");
const axiosThrottle = require("axios-request-throttle");
axiosThrottle.use(axios, { requestsPerSecond: 40 }); //GPT3 limit is 3,000 per minute
// Connection URL
const url = "mongodb://127.0.0.1:27017";
const dbName = "GPT3_Embeddings";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });

const apiKey = process.env.GPT3_API_KEY;
const db = client.db(dbName);
// Get the redCap MongoDB collection
const redCapDataCollection = db.collection("redcap_data");

// Get the gptEmbeddingsCollection collection
const gptEmbeddingsCollection = db.collection("gpt3_redcap_embeddings");

// Use connect method to connect to the server
client.connect(function (err) {
  if (err) throw err;
  console.info("Connected successfully to MongoDB server");

  // Find all documents in the redcap_data collection
  redCapDataCollection.find({}).toArray(async function (err, redcap_data_docs) {
    if (err) throw err;
    console.info("Total Redcap elems length:", redcap_data_docs.length);
    console.info("Generating lists....");
    let notEmbeddedCount = 0;
    let alreadyEmbeddedCount = 0;
    let toEmbedList = [];
    const promises = [];

    let totalWords = 0;
    redcap_data_docs.forEach(async (elem) => {
      promises.push(
        new Promise((resolve) => {
          let words = elem["Variable / Field Name"].split(" ");
          totalWords += words.length;
          gptEmbeddingsCollection.findOne(
            {
              'variableName': elem["Variable / Field Name"],
              'formName': elem["Form Name"],
              'fileName': elem.fileName
            },
            (err, result) => {
              if (err) throw err;
              if (!result) {
                notEmbeddedCount++;
                toEmbedList.push({
                    variableName: elem["Variable / Field Name"],
                    formName: elem["Form Name"],
                    fileName: elem["fileName"],
                    fieldLabel: elem.cleanedFieldLabel
                });
              } else {
                alreadyEmbeddedCount++;
              }
              resolve();
            }
          );
        })
      );
    });
    await Promise.all(promises);

    console.info("Total words", totalWords);
    console.info(
      `You currently have ${alreadyEmbeddedCount} REDCap questions converted and stored in the GPT3 collection`
    );
    console.info(
      "Total REDCap Not Stored in GPT3 Embedded Collection",
      notEmbeddedCount
    );
    console.info(
      `Total words to convert ${totalWords} will cost $0.0004 per 1000 tokens for a grand total of ~$` +
        (totalWords / 1000) * 0.0004
    );
    const continueResponse = await prompts({
      type: "confirm",
      name: "value",
      message: `Do you want to continue with this full list of ${notEmbeddedCount} elements to convert?`,
    });
    if (continueResponse.value) {
      console.info("Continuing...");
      const calls = toEmbedList.map((element) => {
        return callGPT3(gptEmbeddingsCollection, element);
      });

      Promise.all(calls).then(() => {
        console.info("All writes done! Closing MongoDB conn and exiting...");
        client.close();
        process.exit(0);
      });
    } else {
      const limitResponse = await prompts({
        type: "confirm",
        name: "value",
        message: "Do you want to partially convert this list?",
      });
      if (limitResponse.value) {
        console.info("Continuing...");
        const limitAmount = await prompts({
          type: "number",
          name: "value",
          message:
            "Enter the amount you want to convert. This will start at the beginning of the list and end at the amount entered here:",
        });
        if (limitAmount.value) {
          console.info(
            `Continuing with the first ${limitAmount.value} elements`
          );
          const sliced = toEmbedList.slice(0, limitAmount.value);
          //pass sliced list to convert to GPT3 embedding
          const calls = sliced.map((element) => {
            return callGPT3(gptEmbeddingsCollection, element);
          });

          Promise.all(calls).then(() => {
            console.info("All writes done! Closing MongoDB conn and exiting...");
            client.close();
            process.exit(0);
          });
        } else {
          console.info("No value. Exiting...");
          process.exit();
        }
      } else {
        console.info("No partial. Exiting...");
        process.exit();
      }
    }
  });
});

function callGPT3(gptEmbeddingsCollection, obj) {
  // Call GPT-3 text embedding API
  return new Promise((resolve, reject) => {
    axios
      .post(
        "https://api.openai.com/v1/embeddings",
        {
          input: obj.fieldLabel,
          model: "text-embedding-ada-002",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
        }
      )
      .then((response) => {
        // Store response in redcap_embeddings collection
        let modData = {
          variableName: obj.variableName,
          fieldLabel: obj.fieldLabel,
          gpt3_data: response.data,
          lastModified: new Date(),
          fileName: obj.fileName,
          formName: obj.formName
        };
        modData = JSON.stringify(modData);
        // Write the data to a backup file in case of error
        fs.appendFileSync("./gpt3/backup/gpt3responses.json", modData);

        gptEmbeddingsCollection
          .updateOne(
            { variableName: obj.variableName,
                fileName: obj.fileName,
                formName: obj.formName },
            {
              $set: {
                variableName: obj.variableName,
                gpt3_data: response.data,
                lastModified: new Date(),
                fileName: obj.fileName,
                formName: obj.formName,
                fieldLabel: obj.fieldLabel
              },
            },
            { upsert: true }
          )
          .then(() => {
            resolve();
          })
          .catch((error) => {
            console.error("MongoDB Error", error);
            reject();
          });
      })
      .catch((error) => {
        console.error("Axios POST error", error);
        reject();
        client.close();
      });
  });
}
