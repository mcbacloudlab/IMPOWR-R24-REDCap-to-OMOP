const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017'; // replace with your MongoDB connection URL
const mongoClient = new MongoClient(url);

async function connect() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
}

module.exports = { mongoClient, connect };