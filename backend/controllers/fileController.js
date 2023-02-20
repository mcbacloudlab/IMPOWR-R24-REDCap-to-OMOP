const fileService = require("../services/fileService.js");

async function getDDList(req, res) {
  try {
    const ddList = await fileService.getDDList(req, res);
    res.status(200).send(ddList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function getDD(req, res) {
  try {
    const dd = await fileService.getDD(req, res);
    res.status(200).send(dd);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function addDD(req, res) {
    try {
      await fileService.addDD(req, res); 
    } catch (error) {
      console.error(error);
      res.status(500).send("Error");
    }
  }

async function removeDD(req, res) {
  try {
    await fileService.removeDD(req, res);
    // res.status(200).send(dd);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function saveDD(req, res) {
  try {
    await fileService.saveDD(req, res);
    // res.status(200).send(dd);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getDDList,
  getDD,
  addDD,
  removeDD,
  saveDD,
};
