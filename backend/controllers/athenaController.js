const athenaService = require("../services/athenaService.js");

async function getDataByConceptID(req, res) {
  try {
    await athenaService.getDataByConceptID(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function getDetailDataByConceptID(req, res) {
  try {
    await athenaService.getDetailDataByConceptID(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function getDataByText(req, res) {
  try {
    await athenaService.getDataByText(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getDataByConceptID,
  getDetailDataByConceptID,
  getDataByText
};
