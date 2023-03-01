const Bull = require("bull");
const db = require("../db/mysqlConnection.cjs");
var jwt = require("jsonwebtoken");

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
  await myTask(job);
  console.log("task complete?");
});

async function myTask(job) {
  // perform some intensive task here
  console.log(`Processing job with data:`);
  console.log(job.data);
  console.log("jobid", job.id);

  console.log("Starting long running task...");
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    job.progress(progress);
    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 1000);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Long running task completed.");
      resolve();
    }, 15000);
  });
}

async function submit(req, res) {
  try {
    const data = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("jwtVerified", jwtVerified);
    let email = jwtVerified.user;
    console.log('email', email)
    const job = await myQueue.add(data, jobOptions);
    console.log(`Job ${job.id} added to queue`);
    const now = new Date();
    const datetimeString = now.toISOString().slice(0, 19).replace("T", " ");
    const query = "INSERT INTO jobs (userId, jobId, lastUpdated) VALUES(?,?,?)";

    try {
      const [rows, fields] = await db
        .promise()
        .execute(query, [34, job.id, datetimeString]);
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

module.exports = {
  submit,
  getJobStatus,
};
