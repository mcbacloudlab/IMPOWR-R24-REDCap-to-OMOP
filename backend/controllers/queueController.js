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
  getJobStatus,
  getJobReturnData
};