const fs = require("fs");
const xlsx = require("xlsx");
const MongoClient = require("mongodb").MongoClient;
const cliProgress = require("cli-progress");
const prompts = require("prompts");
const path = require("path");
const cheerio = require("cheerio");
const { start } = require("repl");
// Connection URL
const url = "mongodb://127.0.0.1:27017";
// MongoDB Database Name
const dbName = "GPT3_Embeddings";

startProcess();

function startProcess() {
  // Use connect method to connect to the server
  console.info("Connecting to MongoDB...");

  MongoClient.connect(
    url,
    { useUnifiedTopology: true, useNewUrlParser: true, maxPoolSize: 50 },
    function (err, client) {
      if (err) {
        console.error("Error connecting to MongoDB: ", err);
        return;
      }

      console.info("Connected to MongoDB successfully");
      const db = client.db(dbName);
      let redCapCollectionName = "redcap_data";
      // Check if the collection already exists
      db.listCollections({ name: redCapCollectionName }).toArray(
        async function (err, collections) {
          if (err) {
            return console.error(err);
          }
          if (collections.length === 0) {
            // Create a new collection if it doesn't exist
            db.createCollection(
              redCapCollectionName,
              async function (err, collection) {
                if (err) {
                  return console.error(err);
                }
                console.info("Collection created!");
                await updateData(collection);
                console.info("exiting");
                process.exit(0);
              }
            );
          } else {
            console.info("Collection already exists");
            await updateData(db.collection(redCapCollectionName));
            console.info("exiting");
            process.exit(0);
          }
        }
      );

      const updateData = async (collection) => {
        try {
          const { stdin } = process;

          let inputData = "";

          stdin.setEncoding("utf8");
          // read the input data from stdin
          stdin.on("data", (chunk) => {
            inputData += chunk;
          });
          // parse the input data as JSON
          await new Promise((resolve) => {
            stdin.on("end", async () => {
              const jsonData = JSON.parse(inputData);
              await processJsonData(jsonData, collection, client);
              resolve();
            });
          });
        } catch (error) {
          console.error(`Error updating data: ${error}`);
          process.exit(1);
        }
      };
    }
  );
}

function processJsonData(jsonData, collection, client) {
  let fileName = process.argv.slice(2)[0];
  jsonData = JSON.parse(jsonData)
  return new Promise((resolve, reject) => {
    if (jsonData) {
      console.info("JSON key length", Object.keys(jsonData).length);
      console.info("Updating/inserting MongoDB now...");
      const promises = [];

      // create a new progress bar instance and use shades_classic theme
      const bar = new cliProgress.Bar(
        {
          format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
          clearOnComplete: false,
        },
        cliProgress.Presets.shades_classic
      );

      // initialize the progress bar with total number of elements
      bar.start(jsonData.length, 0);
      let insertCounter = 0;

      jsonData.forEach((doc, index) => {
        // Update document based on tinyId
        let standardizedData = [doc].map((obj) => {
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

        doc = standardizedData[0];

        promises.push(
          collection
            .updateOne(
              {
                "Variable / Field Name": doc["Variable / Field Name"],
                "Form Name": doc["Form Name"],
                fileName: fileName,
              },
              {
                $set: {
                  doc,
                  timestamp: new Date(),
                  cleanedFieldLabel: cheerio.load(doc["Field Label"]).text(), //clean HTML out of this column
                },
              },
              { upsert: true }
            )
            .then(() => {
              insertCounter++;
              // Increment the progress bar after the updateOne promise is resolved
              bar.update(insertCounter);
            })
        );
      });
      // Wait for all of the promises to resolve before closing the connection
      Promise.all(promises)
        .then(() => {
          bar.stop();
          console.info("\n All updates/inserts are done!");
          client.close();
          resolve();
        })
        .catch((err) => {
          bar.stop();
          reject(err);
        });
    }
    // });
  });
}