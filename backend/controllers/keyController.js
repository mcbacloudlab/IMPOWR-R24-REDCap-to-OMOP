const keyService = require("../services/keyService.js");

async function queryAllKeys(req, res) {
  console.log("query All Keys");
  try {
    const keys = await keyService.queryAllKeys(req, res);
    console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function updateRedcapKey(req, res) {
  console.log("query All Keys");
  try {
    const keys = await keyService.updateRedcapKey(req, res);
    console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }

}

module.exports = {
  queryAllKeys,
  updateRedcapKey
};
