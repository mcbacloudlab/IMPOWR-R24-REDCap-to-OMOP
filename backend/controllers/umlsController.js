const umlsService = require("../services/umlsService.js");

async function getUMLSSearchResults(req, res) {
  try {
    await umlsService.getUMLSSearchResults(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
    getUMLSSearchResults,
};
