const queueService = require("../services/queueService");

async function submit(req, res) {
  try {
    await queueService.submit(req, res);
  } catch (error) {
    console.error("controller error", error);
  }
}

async function retryJob(req, res) {
  console.log("retry job");
  try {
    await queueService.retryJob(req, res);
  } catch (error) {
    console.error("controller error", error);
  }
}

async function cancelJob(req, res) {
  console.log("retry job");
  try {
    await queueService.cancelJob(req, res);
  } catch (error) {
    console.error("controller error", error);
  }
}

async function updateJobName(req, res) {
  console.log("retry job");
  try {
    await queueService.updateJobName(req, res);
  } catch (error) {
    console.error("controller error", error);
  }
}

async function getJobStatus(req, res) {
  const jobID = req.query.jobID;
  try {
    await queueService.getJobStatus(req, res);
  } catch (error) {
    console.error("controller error", error);
    res.status(500).send("Error");
  }
}

async function getJobReturnData(req, res) {
  const jobID = req.query.jobID;
  try {
    await queueService.getJobReturnData(req, res);
  } catch (error) {
    console.error("controller error", error);
    res.status(500).send("Error");
  }
}

async function storeJobVerifyInfo(req, res){
  try {
    await queueService.storeJobVerifyInfo(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function getJobVerifyInfo(req, res){
  try {
    await queueService.getJobVerifyInfo(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function storeJobCompleteInfo(req, res){
  try {
    await queueService.storeJobCompleteInfo(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function submitJobVerify(req, res) {
  try {
    await queueService.submitJobVerify(req, res);
  } catch (error) {
    console.error("controller error", error);
  }
}

module.exports = {
  submit,
  retryJob,
  getJobStatus,
  getJobReturnData,
  updateJobName,
  cancelJob,
  storeJobVerifyInfo,
  getJobVerifyInfo,
  storeJobCompleteInfo,
  submitJobVerify
};
