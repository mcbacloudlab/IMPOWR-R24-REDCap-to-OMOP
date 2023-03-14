const queueService = require("../services/queueService");

async function submit(req, res) {
  console.log("submit to redis queue");
  try {
    await queueService.submit(req, res);
    // console.log("after submit", status)
    // res.status(200).send(keys);
  } catch (error) {
    console.error("controller error", error);
    //   res.status(500).send("Error");
  }
}

async function retryJob(req, res) {
  console.log("retry job");
  try {
    await queueService.retryJob(req, res);
    // console.log("after submit", status)
    // res.status(200).send(keys);
  } catch (error) {
    console.error("controller error", error);
    //   res.status(500).send("Error");
  }
}

async function cancelJob(req, res) {
  console.log("retry job");
  try {
    await queueService.cancelJob(req, res);
    // console.log("after submit", status)
    // res.status(200).send(keys);
  } catch (error) {
    console.error("controller error", error);
    //   res.status(500).send("Error");
  }
}

async function updateJobName(req, res) {
  console.log("retry job");
  try {
    await queueService.updateJobName(req, res);
    // console.log("after submit", status)
    // res.status(200).send(keys);
  } catch (error) {
    console.error("controller error", error);
    //   res.status(500).send("Error");
  }
}

async function getJobStatus(req, res) {
  const jobID = req.query.jobID;
  console.log("get job status", jobID);
  try {
    await queueService.getJobStatus(req, res);
    // res.status(200).send("Ok");
  } catch (error) {
    console.error("controller error", error);
    res.status(500).send("Error");
  }
}

async function getJobReturnData(req, res) {
  const jobID = req.query.jobID;
  console.log("get job status", jobID);
  try {
    await queueService.getJobReturnData(req, res);
    // res.status(200).send("Ok");
  } catch (error) {
    console.error("controller error", error);
    res.status(500).send("Error");
  }
}
module.exports = {
  submit,
  retryJob,
  getJobStatus,
  getJobReturnData,
  updateJobName,
  cancelJob
};
