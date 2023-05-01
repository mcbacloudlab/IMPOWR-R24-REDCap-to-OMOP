const orcidService = require("../services/orcidService.js");

async function orcidLogin(req, res) {
  // console.log("get redcap forms");
  try {
    await orcidService.orcidLogin(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function orcidCallback(req, res) {
  // console.log("get redcap forms");
  try {
    await orcidService.orcidCallback(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function orcidLogout(req, res) {
  // console.log("get redcap forms");
  try {
    await orcidService.orcidLogout(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  orcidLogin,
  orcidCallback,
  orcidLogout
};
