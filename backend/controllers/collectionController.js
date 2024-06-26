const collectionService = require("../services/collectionService.js");


async function getCollectionNames(req, res){
  try {
    await collectionService.getCollectionNames(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}
async function updateCollectionAltName(req, res){
  try {
    await collectionService.updateCollectionAltName(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getCollectionNames,
  updateCollectionAltName
};
