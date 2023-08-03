const redcapService = require("../services/redcapService.js");

async function getForms(req, res) {
  try {
    await redcapService.getForms(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function exportMetadata(req, res){
  try {
    await redcapService.exportMetadata(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function updateDD(req, res){
  try {
    await redcapService.updateDD(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getForms,
  exportMetadata,
  updateDD
};
