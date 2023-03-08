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
const crypto = require('crypto')
const tls = require('tls');

const apiKey = process.env.GPT3_API_KEY;
const db = client.db(dbName);
// Get the redCap MongoDB collection
const redCapDataCollection = db.collection("redcap_data");

// Get the gptEmbeddingsCollection collection
const gptEmbeddingsCollection = db.collection("gpt3_redcap_embeddings");

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
      const jsonData = JSON.parse(inputData);
      // console.log("json data", jsonData);
      await processJsonData(jsonData);
    });
  } catch (error) {
    console.error(`Error embedding REDCap data: ${error}`);
    process.exit(1);
  }

  function processJsonData(jsonData) {
    jsonData = JSON.parse(jsonData);
    // console.log("jsondata", jsonData);
    // Find all documents in the redcap_data collection
    redCapDataCollection
      .find({})
      .toArray(async function (err, redcap_data_docs) {
        if (err) throw err;
        console.info("Total Redcap elems length:", redcap_data_docs.length);
        console.info("Generating lists....");
        let notEmbeddedCount = 0;
        let alreadyEmbeddedCount = 0;
        let toEmbedList = [];
        const promises = [];

        let totalWords = 0;
        jsonData.forEach(async (elem) => {
          let standardizedData = [elem].map((obj) => {
            const newObj = {};
            for (const key in obj) {
              let standardizedKey;
              if (
                key.toLowerCase().includes("field") &&
                key.toLowerCase().includes("name")
              ) {
                standardizedKey = "Variable / Field Name";
              } else if (
                key.toLowerCase().includes("form") &&
                key.toLowerCase().includes("name")
              ) {
                standardizedKey = "Form Name";
              } else if (
                key.toLowerCase().includes("field") &&
                key.toLowerCase().includes("label")
              ) {
                standardizedKey = "Field Label";
              } else {
                standardizedKey = key;
              }
              newObj[standardizedKey] = obj[key];
            }
            return newObj;
          });

          elem = standardizedData[0];

          // console.log("elem", elem);

          promises.push(
            new Promise((resolve) => {
              let words = elem["Variable / Field Name"].split(" ");
              totalWords += words.length;
              gptEmbeddingsCollection.findOne(
                {
                  variableName: elem["Variable / Field Name"],
                  formName: elem["Form Name"],
                  fieldLabel: cheerio.load(elem["Field Label"]).text(), //clean HTML out of this column,
                },
                (err, result) => {
                  if (err) throw err;
                  if (!result) {
                    notEmbeddedCount++;
                    toEmbedList.push({
                      variableName: elem["Variable / Field Name"],
                      formName: elem["Form Name"],
                      fieldLabel: cheerio.load(elem["Field Label"]).text(), //clean HTML out of this column,
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
         if(!notEmbeddedCount){
          console.log('Already embedded everything here!')
          client.close();
          process.exit(0);
         }
        console.info("Continuing...");
        // console.log('toEmbedList', toEmbedList)
        const calls = toEmbedList.map((element) => {
          return callGPT3(gptEmbeddingsCollection, element);
        });

        Promise.all(calls).then(() => {
          console.info("All GPT3 writes done! Closing MongoDB conn");
          client.close();
          process.exit(0);
        });
      });
  }
});

function callGPT3(gptEmbeddingsCollection, obj) {
  console.log("call gpt3");
  // Call GPT-3 text embedding API
  const agent = new https.Agent({  
    rejectUnauthorized: false
  });
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
          httpsAgent: agent // add the HTTPS agent option here
        },
        
      )
      .then((response) => {
        // Store response in redcap_embeddings collection
        let modData = {
          variableName: obj.variableName,
          fieldLabel: obj.fieldLabel,
          gpt3_data: response.data,
          formName: obj.formName,
          lastModified: new Date(),
        };
        modData = JSON.stringify(modData);
        // Write the data to a backup file in case of error
        // fs.appendFileSync("./gpt3/backup/gpt3responses.json", modData);

        gptEmbeddingsCollection
          .updateOne(
            {
              variableName: obj.variableName,
              formName: obj.formName,
              fieldLabel: obj.fieldLabel,
            },
            {
              $set: {
                variableName: obj.variableName,
                gpt3_data: response.data,
                lastModified: new Date(),
                formName: obj.formName,
                fieldLabel: obj.fieldLabel,
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
