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

//First download REDCap DD from API
// const { exec } = require("child_process");

// exec("node ./mongo/downloadRedcapDictionary.js", (error, stdout, stderr) => {
//   console.log(`stdout: ${stdout}`);
//   if (error) {
//     console.error(`exec error: ${error}`);
//     return;
//   }
  
//   startProcess();
//   // console.error(`stderr: ${stderr}`);
// });

startProcess()

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
                process.exit(0);
              }
            );
          } else {
            console.info("Collection already exists");
            await updateData(db.collection(redCapCollectionName));
            process.exit(0);
          }
        }
      );

      const updateData = async (collection) => {
        let redcapFullPath = await main();
        return new Promise((resolve, reject) => {
          const fileName = path.basename(redcapFullPath);
          fs.readFile(redcapFullPath, function (err, data) {
            if (err) {
              console.error("Error reading file: ", err);
              return;
            }
            if (data) {
              let workbook = xlsx.read(data, { type: "buffer" });
              let sheet_name_list = workbook.SheetNames;
              let jsonData = xlsx.utils.sheet_to_json(
                workbook.Sheets[sheet_name_list[0]]
              );
              console.info("JSON key length", Object.keys(jsonData).length);
              console.info("Updating/inserting MongoDB now...");
              const promises = [];

              // create a new progress bar instance and use shades_classic theme
              const bar = new cliProgress.Bar(
                {
                  format:
                    "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
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
                promises.push(
                  collection
                    .updateOne(
                      {
                        "Variable / Field Name": doc['Variable / Field Name'],
                        "Form Name": doc['Form Name'],
                        fileName: fileName,
                      },
                      {
                        $set: {
                          doc,
                          timestamp: new Date(),
                          cleanedFieldLabel: cheerio
                            .load(doc['Field Label'])
                            .text(), //clean HTML out of this column
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
          });
        });
      };
    }
  );
}

// function to read directory and return a list of files
const readDir = (dir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
};

// function to check if selected file is a directory
const isDirectory = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats.isDirectory());
      }
    });
  });
};

// function to prompt user to select a file or directory
const selectFile = async (files, dir) => {
  const choices = files.map((file) => {
    return { title: file, value: file };
  });
  // add option to go up a directory
  if (dir !== "/") {
    choices.unshift({ title: ".. (Go up a directory)", value: ".." });
  }
  const response = await prompts({
    type: "select",
    name: "value",
    message:
      "Select the Redcap Data Dictionary you wish to import into MongoDB, the data dictionary file downloaded via the REDCap will is titled at redcap_data_dictionary.xlsx by default",
    choices: choices,
  });
  let selectedFile = response.value;
  if (selectedFile === "..") {
    const parentDir = path.resolve(dir, "..");
    const newFiles = await readDir(parentDir);
    return selectFile(newFiles, parentDir);
  } else {
    selectedFile = path.join(dir, selectedFile);
    const isDir = await isDirectory(selectedFile);
    if (isDir) {
      const newFiles = await readDir(selectedFile);
      return selectFile(newFiles, selectedFile);
    } else {
      return path.resolve(selectedFile);
    }
  }
};

// main function
const main = async () => {
  try {
    // read directory
    const dir = __dirname + "/data/Redcap/";
    const files = await readDir(dir);
    // prompt user to select a file or directory
    const selectedFile = await selectFile(files, dir);
    console.info(`You selected: ${selectedFile}`);
    return selectedFile;
  } catch (err) {
    console.error(err);
  }
};
