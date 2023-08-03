const keyService = require("../services/keyService.js");

async function queryAllKeys(req, res) {
  try {
    const keys = await keyService.queryAllKeys(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function updateAPIKey(req, res) {
  try {
    await keyService.updateAPIKey(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function testRedcapAPI(req, res){
  try {
    const keys = await keyService.testRedcapAPI(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function testUMLSAPI(req, res){
  try {
    const keys = await keyService.testUMLSAPI(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function testGPT3API(req, res){
  try {
    const keys = await keyService.testGPT3API(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}


module.exports = {
  queryAllKeys,
  updateAPIKey,
  testRedcapAPI,
  testUMLSAPI,
  testGPT3API
};
