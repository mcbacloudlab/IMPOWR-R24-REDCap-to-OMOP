const Bull = require("bull");
const db = require("../db/mysqlConnection.cjs");
var jwt = require("jsonwebtoken");
const { getUserByEmail } = require("./userService.js");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { mongoClient, connect } = require("../db/mongoDBConnection"); // Assuming 'db' is the name of the file you created

async function connectMongo() {
  await connect();
}

const myQueue = new Bull("process-queue", {
  redis: {
    host: "localhost",
    port: 6379,
  },
});

const jobOptions = {
  removeOnComplete: false, // remove job from queue when complete
  attempts: 1, // number of times to attempt job if it fails
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  progress: true,
  // prevent concurrency, so that only one job is processed at a time
  concurrency: 1,
};

myQueue.process(jobOptions.concurrency, async (job) => {
  // console.log("job", job.data);
  let jobData = JSON.parse(job.data.data);
  let result;
  const containsLookupTrue = jobData.some((element) => element.lookup === true);
  // console.log("contains lookup", containsLookupTrue);
  if (job.data.lookup && containsLookupTrue) {
    await embedRedcapLookupText(job);
  } else if (job.data.lookup) {
    //nothing to lookup, everything was already embedded
    console.log("No lookups to embed, done");
    return;
  } else {
    await importToMongo(job);
    await embedRedcapText(job);
    result = await compareEmbeddings(job);
    if (result) {
      // console.log("result to return", result.toString());
      console.log(`Job ${job.id} finished. Returning results`);
    } else {
      console.log("No result");
    }
  }

  return result;
});

async function importToMongo(job) {
  console.log("jobid", job.id);

  console.log("Starting Import into REDCap MongoDB...");
  job.progress(0);
  console.log("job.data");

  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(
      __dirname,
      "../mongo/import_To_MongoDB.js"
    );
    const args = ["--max-old-space-size=16384"];
    const data = job.data.data;
    const filename = job.data.selectedForm;
    const process = spawn("node", args.concat([scriptPath, filename]), {
      stdio: "pipe",
    });
    console.log(`Sending input data with length ${data.length}`);
    process.stdin.write(JSON.stringify(data));
    process.stdin.end();

    let capturedData;
    process.stdout.on("data", (data) => {
      if (!data.toString().startsWith("[[")) {
        console.log(`stdout: ${data}`);
        if (data.toString().startsWith("Loaded")) job.progress(1);
        // if (data.toString().startsWith("Chunking")) job.progress(50);
      }

      if (data.toString().startsWith("[[")) {
        // console.log("data to capture");
        capturedData = data;
      }
      // console.log('captured data', capturedData)
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log("Import to mongo finished successfully");
        resolve(capturedData);
      } else {
        console.error(`compareRedcapToSnomed.js failed with code ${code}`);
        reject(`Import to mongo failed with code ${code}`);
      }
    });
  });
}

async function embedRedcapText(job) {
  console.log("jobid", job.id);

  console.log("Starting REDCap GPT3 Embedding...");

  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, "../gpt3/getGPT3Embedding.js");
    const args = ["--max-old-space-size=16384"];
    const data = job.data.data;
    const filename = job.data.selectedForm;
    const process = spawn("node", args.concat([scriptPath, filename]), {
      stdio: "pipe",
    });
    console.log(`Sending input data with length ${data.length}`);
    process.stdin.write(JSON.stringify(data));
    process.stdin.end();

    let capturedData;
    process.stdout.on("data", (data) => {
      // console.log("data", data.toString());

      if (data.toString().startsWith("[[")) {
        // console.log("data to capture");
        capturedData = data;
      }else{
        console.log('data', data.toString()) //comment this out in production...maybe not
      }
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log("REDCap GPT3 finished successfully");
        resolve(capturedData);
      } else {
        console.error(`compareRedcapToSnomed.js failed with code ${code}`);
        reject(`REDCap GPT3 failed with code ${code}`);
      }
    });
  });
}

async function embedRedcapLookupText(job) {
  console.log("jobid", job.id);
  console.log("Starting REDCap Lookup GPT3 Embedding...");

  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, "../gpt3/redcapLookupEmbed.js");
    const args = ["--max-old-space-size=16384"];
    const data = job.data.data;
    const filename = job.data.selectedForm;
    const process = spawn("node", args.concat([scriptPath, filename]), {
      stdio: "pipe",
    });
    console.log(`Sending input data with length ${data.length}`);
    process.stdin.write(JSON.stringify(data));
    process.stdin.end();

    let capturedData;
    process.stdout.on("data", (data) => {
      // console.log("data", data.toString());

      if (data.toString().startsWith("[[")) {
        // console.log("data to capture");
        capturedData = data;
      }
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log("REDCap GPT3 finished successfully");
        resolve(capturedData);
      } else {
        console.error(`compareRedcapToSnomed.js failed with code ${code}`);
        reject(`REDCap GPT3 failed with code ${code}`);
      }
    });
  });
}

async function extractCollections(logMessage) {
  console.log("extract collections", logMessage);

  // This will match anything within single quotes
  const regex = /'([^']+)'/g;
  let match;
  const collectionsArray = [];

  // While there's a match, push it to the collectionsArray
  while ((match = regex.exec(logMessage)) !== null) {
    collectionsArray.push(match[1]);
  }

  if (collectionsArray.length > 0) {
    console.log("return this collection array", collectionsArray);
    return collectionsArray;
  } else {
    return [];
  }
}

let activeJobProcess;
async function compareEmbeddings(job) {
  console.log("jobid", job.id);
  let _jobId = job.id
  let storedTotal = false;
  console.log("Starting Embedding Comparisons...");
  // console.log("job.data", job.data);

  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(
      __dirname,
      "../gpt3/compareRedcapToSnomed.js"
    );
    const args = ["--max-old-space-size=16384"];
    const data = job.data.data;
    const filename = job.data.selectedForm;
    const collectionsToUse = job.data.collections;
    const process = spawn(
      "node",
      args.concat([scriptPath, filename, collectionsToUse]),
      {
        stdio: "pipe",
      }
    );
    activeJobProcess = process;
    console.log(`Sending input data with length ${data.length}`);
    process.stdin.write(JSON.stringify(data)); //pass data into child process
    process.stdin.end();

    let totalDocuments, currentDocument, collectionName;
    let capturedData = "";
    // ********************
    // Using startsWith is not very reliable when you start adding console.logs to the process.
    // It's not reliable due to the standard output occassionally lumping outputs together. Using a delimiter and capturing the entire standard output would likely be more reliable here
    // ********************
    let buffer = "";

    process.stdout.on("data", async (data) => {
      buffer += data.toString();

      while (true) {
        const endObjectIndex = buffer.indexOf("}\n");

        const logMessage = data.toString().trim();
        //******************
        //******************
        // LOG logMessage to see the console.logs from the worker threads
        // for development and testing, comment this out in prod
        // if (process.env.NODE_ENV == 'local' || process.env.LOG_LEVEL == 'verbose') {
          // console.log(logMessage)
        // }
        //******************
        //******************

        if (logMessage.startsWith("Processing Document At")) {
          const currentDocument = parseInt(logMessage.split(":")[1].trim());
          console.log("Current Document:", currentDocument);
          console.log("Total Documents:", totalDocuments);
          console.log(
            "setting job to: ",
            currentDocument / totalDocuments
              ? currentDocument / totalDocuments
              : 0
          );
          job.progress(
            currentDocument / totalDocuments
              ? Math.round((currentDocument / totalDocuments) * 100)
              : 1
          );
        }
        if (logMessage.includes("Collection(s) used")) {
          console.log(logMessage);

          // collectionName = logMessage.split(":")[1];
          collectionName = await extractCollections(logMessage);
          // console.log('collectionNAME!!', collectionName)
          if(collectionName.length){
            collectionName = collectionName.join(',')
          }
          
          if (!collectionName || !totalDocuments || !job.id) return;
          console.log("collectionName", collectionName);
          console.log("totalDocuments", totalDocuments);
          console.log('job id', job.id)
          console.log("Storing total docs in db for job", totalDocuments);
          // if(!collectionName || !totalDocuments || !job.id) return;
          const query =
            "UPDATE jobs set collectionName=?, totalCollectionDocs=? where jobId = ?";
          try {
            const [rows, fields] = await db
              .promise()
              .execute(query, [collectionName, totalDocuments, job.id]);
            console.log("MongoDB collection info updated in DB for job");
          } catch (err) {
            console.log("error!", err);
            throw new Error("Error");
          }
        }
        if (logMessage.startsWith("Total Documents")) {
          totalDocuments = parseInt(logMessage.split(":")[1].trim());
          if (!collectionName || !totalDocuments || !job.id) return;
          console.log("collectionName", collectionName);
          console.log("totalDocuments", totalDocuments);
          console.log('job id', job.id)
          console.log(
            "Starts with Total Docs: Storing total docs in db for job",
            totalDocuments
          );

          try {
            // First, fetch the current totalCollectionDocs value from the database
            const [currentRows] = await db
              .promise()
              .execute("SELECT totalCollectionDocs FROM jobs WHERE jobId = ?", [
                job.id,
              ]);
            const currentTotalDocs = currentRows[0]?.totalCollectionDocs || 0;

            // Add the new totalDocuments to the current value
            const newTotalDocs = currentTotalDocs + totalDocuments;
            console.log('newTotal', newTotalDocs)
            console.log('jobid', job.id)  
            console.log('collname', collectionName)
            // Update the database with the new accumulated value
            const updateQuery =
              "UPDATE jobs SET collectionName = ?, totalCollectionDocs = ? WHERE jobId = ?";
            const [rows] = await db
              .promise()
              .execute(updateQuery, [collectionName, newTotalDocs, job.id]);

            console.log(
              "MongoDB collection info updated in MySQL DB for job:" +
                job.id +
                " with doc size:" +
                newTotalDocs
            );
          } catch (err) {
            console.log("error!", err);
            throw new Error("Error");
          }
        } else {
          // console.log("log:", logMessage);
        }

        if (endObjectIndex === -1) {
          // We don't have a complete JSON object yet
          break;
        }

        const jsonString = buffer.slice(0, endObjectIndex + 1);
        buffer = buffer.slice(endObjectIndex + 2);

        if (jsonString.startsWith('{"endResult":')) {
          capturedData = JSON.parse(jsonString).endResult;
          capturedData = JSON.stringify(capturedData);
        } else {
        }
      }
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("close", (code) => {
      if (code === 0 && capturedData) {
        console.log("Embedding comparisons finished successfully");
        job.progress(100);
        // console.log('resolved', capturedData)
        resolve(capturedData);
      } else {
        console.error(
          `Embedding comparison failed or was cancelled with code ${code}`
        );
        reject(
          `Embedding comparison failed or was cancelled with code ${code}`
        );
      }
    });
  });
}

async function submit(req, res) {
  try {
    const data = req.body;
    console.log("data", data.filename);
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader &&
      authHeader.split(" ")[1] !== "undefined" &&
      authHeader.split(" ")[1] !== "null"
        ? authHeader.split(" ")[1]
        : null;

    // Get token from httpOnly cookie, if it exists
    const tokenFromCookie = req.cookies.token;
    // Use the token from the header if it exists; otherwise, use the token from the cookie
    token = tokenFromHeader || tokenFromCookie;
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("jwtVerified", jwtVerified);
    let email = jwtVerified.user;
    let userId;
    if (jwtVerified.user == "orcidUser") {
      userId = jwtVerified.orcidId;
      email = userId;
    } else {
      userId = await getUserByEmail(email);
      userId = userId[0].id;
    }

    // console.log("email", email);
    // console.log("the user id!!", userId);
    const job = await myQueue.add(data, jobOptions);
    console.log(`Job ${job.id} added to queue`);
    const now = new Date();
    const datetimeString = now.toISOString().slice(0, 19).replace("T", " ");
    const query =
      "INSERT INTO jobs (userId, jobId, jobName, redcapFormName, lastUpdated) VALUES(?,?,?,?,?)";

    try {
      const [rows, fields] = await db
        .promise()
        .execute(query, [
          userId,
          job.id,
          data.selectedForm,
          data.selectedForm,
          datetimeString,
        ]);
      console.log("Job inserted into DB");
      res.send(`Job ${job.id} added to queue`);
    } catch (err) {
      console.log("error!", err);
      throw new Error("Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding job to queue");
  }
}

async function retryJob(req, res) {
  try {
    const jobId = req.body.jobId;
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader &&
      authHeader.split(" ")[1] !== "undefined" &&
      authHeader.split(" ")[1] !== "null"
        ? authHeader.split(" ")[1]
        : null;

    // Get token from httpOnly cookie, if it exists
    const tokenFromCookie = req.cookies.token;
    // Use the token from the header if it exists; otherwise, use the token from the cookie
    token = tokenFromHeader || tokenFromCookie;
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("jwtVerified", jwtVerified);
    let email = jwtVerified.user;
    let userId = await getUserByEmail(email);
    userId = userId[0].id;
    console.log("email", email);
    console.log("the user id!!", userId);

    // retry a failed job by ID
    myQueue
      .getJob(jobId)
      .then((job) => {
        if (!job) {
          console.error("Job not found");
        } else if (job.failedReason) {
          console.log("job.failedReason", job.failedReason);
          job.retry();
        } else {
          console.error("Job has not failed");
        }
      })
      .catch((err) => {
        console.error("Error getting job:", err);
      });

    const now = new Date();
    const datetimeString = now.toISOString().slice(0, 19).replace("T", " ");
    const query =
      "INSERT INTO jobs (userId, jobId, lastUpdated) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE lastUpdated = VALUES(lastUpdated), jobStatus = 'retrying' ";

    try {
      const [rows, fields] = await db
        .promise()
        .execute(query, [userId, jobId, datetimeString]);
      console.log("Job inserted into DB");
      res.send(`Job ${jobId} added to queue`);
    } catch (err) {
      console.log("error!", err);
      throw new Error("Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding job to queue");
  }
}

async function cancelJob(req, res) {
  try {
    const jobId = req.body.jobId;
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader &&
      authHeader.split(" ")[1] !== "undefined" &&
      authHeader.split(" ")[1] !== "null"
        ? authHeader.split(" ")[1]
        : null;

    // Get token from httpOnly cookie, if it exists
    const tokenFromCookie = req.cookies.token;
    // Use the token from the header if it exists; otherwise, use the token from the cookie
    token = tokenFromHeader || tokenFromCookie;
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("jwtVerified", jwtVerified);
    let email = jwtVerified.user;
    let userId = await getUserByEmail(email);
    userId = userId[0].id;
    console.log("email", email);
    console.log("the user id!!", userId);
    console.log("jobid", jobId);
    // retry a failed job by ID
    myQueue
      .getJob(jobId)
      .then(async (job) => {
        if (!job) {
          console.error("Job not found");
          res.send(`Job ${jobId} not found`);
        } else {
          job.getState().then(async (jobState) => {
            console.log("is com", jobState);
            if (jobState == "active") {
              job
                .releaseLock()
                .then(() => {
                  job
                    .remove()
                    .then(() => {
                      console.log(
                        `Job ${jobId} has been removed from the queue`
                      );
                      activeJobProcess.kill("SIGTERM");
                      dbCancelUpdate(userId, jobId);
                    })
                    .catch((err) => {
                      console.log(`Error while removing job ${jobId}: ${err}`);
                    });
                })
                .catch((err) => {
                  console.log(`Error while pausing job ${jobId}: ${err}`);
                });
            } else if (jobState != "completed") {
              // console.log("job.progress", job.isActive);
              job
                .remove()
                .then(async () => {
                  console.log(`Job ${jobId} has been removed from the queue`);
                  dbCancelUpdate(userId, jobId);
                })
                .catch((err) => {
                  console.log(`Error while removing job ${jobId}: ${err}`);
                  console.log("the err");
                  console.log(err);
                });
            } else {
              job.remove().then(() => {
                res.send("Job has already completed");
              });
            }
          });
        }
      })
      .catch((err) => {
        console.error("Error getting job:", err);
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding job to queue");
  }

  async function dbCancelUpdate(userId, jobId) {
    const now = new Date();
    const datetimeString = now.toISOString().slice(0, 19).replace("T", " ");
    const query =
      "INSERT INTO jobs (userId, jobId, lastUpdated) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE lastUpdated = VALUES(lastUpdated), jobStatus = 'cancelled' ";

    try {
      const [rows, fields] = await db
        .promise()
        .execute(query, [userId, jobId, datetimeString]);
      console.log(`Job ${jobId} has been cancelled`);
      res.send(`Job ${jobId} has been cancelled`);
    } catch (err) {
      console.log("error!", err);
      throw new Error("Error");
    }
  }
}

async function updateJobName(req, res) {
  try {
    const jobId = req.body.jobId;
    const jobName = req.body.jobName;
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader &&
      authHeader.split(" ")[1] !== "undefined" &&
      authHeader.split(" ")[1] !== "null"
        ? authHeader.split(" ")[1]
        : null;

    // Get token from httpOnly cookie, if it exists
    const tokenFromCookie = req.cookies.token;
    // Use the token from the header if it exists; otherwise, use the token from the cookie
    token = tokenFromHeader || tokenFromCookie;
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("jwtVerified", jwtVerified);
    let email = jwtVerified.user;
    let userId = await getUserByEmail(email);
    userId = userId[0].id;
    console.log("email", email);
    console.log("the user id!!", userId);

    myQueue
      .getJob(jobId)
      .then(async (job) => {
        if (!job) {
          console.error("Job not found");
        } else {
          const now = new Date();
          const datetimeString = now
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
          const query = "UPDATE jobs SET jobName = ? WHERE jobId = ?";

          try {
            const [rows, fields] = await db
              .promise()
              .execute(query, [jobName, jobId]);
            console.log("Job name updated");
            res.send(`Job ${jobId} name updated`);
          } catch (err) {
            console.log("error!", err);
            throw new Error("Error");
          }
        }
      })
      .catch((err) => {
        console.error("Error getting job:", err);
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating job name");
  }
}

async function getJobStatus(req, res) {
  console.log("get jobstat", req.query.jobID);
  let jobID = req.query.jobID;
  if (!jobID) {
    throw new Error("Error");
  }
  // Get the status of the job
  try {
    const jobStatus = await myQueue.getJob(jobID).then((job) => job.getState());

    console.log("Job status:", jobStatus);
    res.status(200).send(jobStatus);
  } catch (error) {
    console.log("error!!!!", error);
    res.status(500).send("Error");
  }
}

async function getJobReturnData(req, res) {
  // console.log("get jobstat", req.query.jobID);
  let jobID = req.query.jobID;
  if (!jobID) {
    throw new Error("Error");
  }
  // Get the status of the job
  try {
    const myJob = await myQueue.getJob(jobID);
    // console.log('found job')
    const buffer = Buffer.from(myJob.returnvalue);
    const result = JSON.parse(buffer.toString());
    // console.log("job return value", result);
    res.status(200).send(result);
  } catch (error) {
    console.log("error!!!!", error);
    res.status(500).send("Error");
  }
}

async function storeJobVerifyInfo(req, res) {
  connectMongo();
  try {
    // Get the database and the collection
    const db = mongoClient.db("GPT3_Embeddings"); // replace with your database name
    const collection = db.collection("jobVerifyInfo");
    console.log(req.body.jobData.length);
    // Define the filter for identifying the document to update
    const filter = {
      jobId: req.body.jobId,
      formName: req.body.formName,
    };

    // Define the update operation to be performed
    const update = {
      $set: req.body,
    };

    // Update the document or insert a new one if not found
    await collection.updateOne(filter, update, { upsert: true });

    // Close the MongoDB client (Consider keeping it open for reuse)
    // await mongoClient.close();

    // Send a successful response
    res.status(200).send("Ok");
  } catch (error) {
    console.error("Error listing collections", error);
    res.status(500).send("Error");
  }
}

async function storeJobCompleteInfo(req, res) {
  connectMongo();
  try {
    // Get the database and the collection
    const db = mongoClient.db("GPT3_Embeddings"); // replace with your database name
    const collection = db.collection("jobCompleteInfo");

    // Define the filter for identifying the document to update
    const filter = {
      jobId: req.body.jobId,
      formName: req.body.formName,
    };

    // Define the update operation to be performed
    const update = {
      $set: req.body,
    };

    // Update the document or insert a new one if not found
    await collection.updateOne(filter, update, { upsert: true });

    // Close the MongoDB client (Consider keeping it open for reuse)
    // await mongoClient.close();

    // Send a successful response
    res.status(200).send("Ok");
  } catch (error) {
    console.error("Error listing collections", error);
    res.status(500).send("Error");
  }
}

async function getJobVerifyInfo(req, res) {
  try {
    // Connect to MongoDB
    await mongoClient.connect();

    // Get the database and the collection
    const db = mongoClient.db("GPT3_Embeddings"); // replace with your database name
    const collection = db.collection("jobVerifyInfo");
    // console.log('req.body', req.body)
    // Define the filter for identifying the document to find
    const filter = {
      jobId: req.body.jobId,
      formName: req.body.formName,
    };
    // Find the document based on the filter
    const document = await collection.findOne(filter);

    // Close the MongoDB client (Consider keeping it open for reuse)
    // await mongoClient.close();

    // Check if the document was found
    if (document) {
      // Send the found document as a successful response
      res.status(200).json(document);
    } else {
      // Send a not found response
      res.status(500).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    // Send an error response
    res.status(500).send("Error");
  }
}

async function submitJobVerify(req, res) {
  try {
    const data = req.body;
    // console.log("data", data.filename);
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader &&
      authHeader.split(" ")[1] !== "undefined" &&
      authHeader.split(" ")[1] !== "null"
        ? authHeader.split(" ")[1]
        : null;

    // Get token from httpOnly cookie, if it exists
    const tokenFromCookie = req.cookies.token;
    // Use the token from the header if it exists; otherwise, use the token from the cookie
    token = tokenFromHeader || tokenFromCookie;
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("jwtVerified", jwtVerified);
    let email = jwtVerified.user;
    let userId = await getUserByEmail(email);
    userId = userId[0].id;
    // console.log("email", email);
    // console.log("the user id!!", userId);
    const job = await myQueue.add(data, jobOptions);
    console.log(`Job ${job.id} added to queue`);
    const now = new Date();
    const datetimeString = now.toISOString().slice(0, 19).replace("T", " ");
    const query =
      "INSERT INTO jobs (userId, jobId, jobName, redcapFormName, lastUpdated) VALUES(?,?,?,?,?)";

    try {
      const [rows, fields] = await db
        .promise()
        .execute(query, [
          userId,
          job.id,
          "lookupEmbeddings",
          data.selectedForm,
          datetimeString,
        ]);
      console.log("Job inserted into DB");
      res.send(`Job ${job.id} added to queue`);
    } catch (err) {
      console.log("error!", err);
      throw new Error("Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding job to queue");
  }
}

module.exports = {
  submit,
  getJobStatus,
  getJobReturnData,
  retryJob,
  updateJobName,
  cancelJob,
  storeJobVerifyInfo,
  getJobVerifyInfo,
  storeJobCompleteInfo,
  submitJobVerify,
};
