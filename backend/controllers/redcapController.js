const redcapService = require("../services/redcapService.js");

async function getForms(req, res) {
  // console.log("get redcap forms");
  try {
    await redcapService.getForms(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function exportMetadata(req, res){
  // console.log("get redcap metadata");
  try {
    await redcapService.exportMetadata(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function exportRecords(req, res){
  // console.log("get redcap metadata");
  try {
    await redcapService.exportRecords(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getForms,
  exportMetadata,
  exportRecords
};
