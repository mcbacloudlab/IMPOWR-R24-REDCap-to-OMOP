const { mongoClient, connect } = require("../db/mongoDBConnection");
const mysqlDB = require("../db/mysqlConnection.cjs");

async function getCollectionNames(req, res) {
  try {
    // Wait for the connection to be established before proceeding
    await connect();

    const db = mongoClient.db("GPT3_Embeddings");
    const collections = await db.listCollections().toArray();
    let collectionStats = [];
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const stats = await coll.stats();
      const documentCount = stats.count;
      const storageSize = stats.storageSize;
      collectionStats.push({
        name: collection.name,
        documentCount: documentCount,
        storageSize: storageSize,
      });
    }

    const query = "SELECT * FROM collections";

    mysqlDB.execute(query, [], function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        res.status(500).send("Error");
      }
      const joinedArray = collectionStats.map(stat => {
        const matchingResult = results.find(result => result.collection_name === stat.name);
        return {
          ...stat,
          ...matchingResult
        };
      });
      res.status(200).send(joinedArray);
    });
  } catch (error) {
    console.error("Error listing collections", error);
    res.status(500).send("Error");
  }
}

async function updateCollectionAltName(req, res) {
  try {
    console.log("req.", req.body);

    const collection_name = req.body.collection_name;
    const collection_alt_name = req.body.collection_alt_name;

    const query = `
      INSERT INTO collections (collection_name, collection_alt_name)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE collection_alt_name = VALUES(collection_alt_name);
    `;

    mysqlDB.execute(
      query,
      [collection_name, collection_alt_name],
      function (err, results, fields) {
        if (err) {
          console.log("error!", err);
          res.status(500).send("Error");
          return; // Make sure to return here so the function doesn't continue execution
        }
        res.status(200).send('Ok');
      }
    );
  } catch (error) {
    console.error("Error updating collection alt", error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getCollectionNames,
  updateCollectionAltName,
};
