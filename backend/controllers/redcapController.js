const redcapService = require("../services/redcapService.js");

async function getForms(req, res) {
  console.log("get redcap forms");
  try {
    await redcapService.getForms(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getForms,
};
