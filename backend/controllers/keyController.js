const keyService = require("../services/keyService.js");

async function queryAllKeys(req, res) {
  // console.log("query All Keys");
  try {
    const keys = await keyService.queryAllKeys(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function updateAPIKey(req, res) {
  // console.log("query All Keys");
  try {
    await keyService.updateAPIKey(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function testRedcapAPI(req, res){
  console.log("testRedcapAPI");
  try {
    const keys = await keyService.testRedcapAPI(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function testUMLSAPI(req, res){
  // console.log("testUMLSAPI");
  try {
    const keys = await keyService.testUMLSAPI(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}


module.exports = {
  queryAllKeys,
  updateAPIKey,
  testRedcapAPI,
  testUMLSAPI
};
