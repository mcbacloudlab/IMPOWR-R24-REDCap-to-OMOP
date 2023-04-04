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
const https = require("https");
const cheerio = require("cheerio");
const crypto = require("crypto");
const tls = require("tls");

const apiKey = process.env.GPT3_API_KEY;
const db = client.db(dbName);
// Get the redCap MongoDB collection
const redCapDataCollection = db.collection("jobCompleteInfo");

// Get the gptEmbeddingsCollection collection
const gptEmbeddingsCollection = db.collection("gpt3_redcap_lookup_embeddings");

// Use connect method to connect to the server
client.connect(async function (err) {
  if (err) throw err;
  console.info("Connected successfully to MongoDB server");

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
      let jsonData = JSON.parse(inputData);
      jsonData = JSON.parse(jsonData);
      const filteredArray = jsonData.filter(
        (element) => element.lookup === true
      );
      console.log("filteredArray", filteredArray);
      // process.exit(0)
      await processJsonData(filteredArray);
      console.log("Everything done. Ending...");
      client.close();
      process.exit(0);
    });
  } catch (error) {
    console.error(`Error embedding REDCap data: ${error}`);
    process.exit(1);
  }

  async function processJsonData(jsonData) {
    for (const item of jsonData) {
      const fieldLabel = item.redcapFieldLabel;

      // Find a document with a matching "fieldLabel"
      const foundDocument = await gptEmbeddingsCollection.findOne({
        fieldLabel: fieldLabel,
      });

      // If no matching document is found, call the "callGPT3" function with the current item
      if (!foundDocument) {
        await callGPT3(gptEmbeddingsCollection, item);
      }
    }
  }
});

function callGPT3(gptEmbeddingsCollection, obj) {
  console.log("call gpt3", obj);
  // Call GPT-3 text embedding API
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  return new Promise((resolve, reject) => {
    axios
      .post(
        "https://api.openai.com/v1/embeddings",
        {
          input: obj.redcapFieldLabel,
          model: "text-embedding-ada-002",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          httpsAgent: agent, // add the HTTPS agent option here
        }
      )
      .then((response) => {
        // Store response in redcap_embeddings collection
        let modData = {
          fieldLabel: obj.redcapFieldLabel,
          matchingText: obj.snomedText,
          matchingID: obj.snomedID,
          gpt3_data: response.data,
          lastModified: new Date(),
        };
        modData = JSON.stringify(modData);
        // Write the data to a backup file in case of error
        // fs.appendFileSync("./gpt3/backup/gpt3responses.json", modData);

        gptEmbeddingsCollection
          .updateOne(
            {
              fieldLabel: obj.redcapFieldLabel,
            },
            {
              $set: {
                fieldLabel: obj.redcapFieldLabel,
                matchingID: obj.snomedID,
                matchingText: obj.snomedText,
                gpt3_data: response.data,
                lastModified: new Date(),
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
