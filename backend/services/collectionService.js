const { mongoClient, connect } = require("../db/mongoDBConnection");

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
    res.status(200).send(collectionStats);
  } catch (error) {
    console.error("Error listing collections", error);
    res.status(500).send("Error");
  }
}

module.exports = {
  getCollectionNames
};
