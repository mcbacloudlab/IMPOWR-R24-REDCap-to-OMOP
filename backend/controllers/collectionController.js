const collectionService = require("../services/collectionService.js");


async function getCollectionNames(req, res){
  // console.log("testUMLSAPI");
  try {
    const keys = await collectionService.getCollectionNames(req, res);
    // console.log("keys", keys);
    // res.status(200).send(keys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}


module.exports = {
  getCollectionNames,
};
