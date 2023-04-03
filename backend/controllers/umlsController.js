const umlsService = require("../services/umlsService.js");

async function getUMLSSearchResults(req, res) {
  // console.log("get redcap forms");
  try {
    await umlsService.getUMLSSearchResults(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
    getUMLSSearchResults,
};
