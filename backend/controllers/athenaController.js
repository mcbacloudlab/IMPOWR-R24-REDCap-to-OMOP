const athenaService = require("../services/athenaService.js");

async function getDataByConceptID(req, res) {
  try {
    await athenaService.getDataByConceptID(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}


module.exports = {
    getDataByConceptID
};
