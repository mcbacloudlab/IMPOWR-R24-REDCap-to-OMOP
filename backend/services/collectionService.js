const { mongoClient, connect } = require("../db/mongoDBConnection"); // Assuming 'db' is the name of the file you created

async function connectMongo() {
  await connect();
}

async function getCollectionNames(req, res) {
  //   console.log("get collection names", req.query.jobID);
  console.log("get collection names");
  connectMongo();
  try {
    const db = mongoClient.db("GPT3_Embeddings"); // replace with your database name
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
      //   console.log(
      //     `Collection: ${collection.name}, Document count: ${documentCount}, Storage size: ${storageSize}`
      //   );
    }
    res.status(200).send(collectionStats);
    await mongoClient.close();
  } catch (error) {
    console.error("Error listing collections", error);
    res.status(500).send("Error");
    await mongoClient.close();
  }
}



module.exports = {
  getCollectionNames
};
