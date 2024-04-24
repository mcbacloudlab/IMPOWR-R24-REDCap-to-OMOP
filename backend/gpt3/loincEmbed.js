//connects to POSTGres redcap2omop_development/public/concept to get loinc text to send to GPT3 API and store reponses in MongoDB

const MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const prompts = require("prompts");
const axiosThrottle = require("axios-request-throttle");
axiosThrottle.use(axios, { requestsPerSecond: 40 }); //GPT3 limit is 3,000 per minute, might need to adjust to avoid any sort of rate limit errors
const ProgressBar = require("cli-progress");
const { Client } = require("pg");

const gpt3ApiKey = process.env.GPT3_API_KEY;
const pgClient = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASS,
  port: process.env.PG_PORT,
});

let pgResults;

pgClient.connect(async (err) => {
  if (err) {
    console.error("connection error", err.stack);
  } else {
    console.info("Connected to PostgreSQL");
    try {
      const res = await query();
      console.info("Got PostGres rows: ", res.rows.length);
      pgResults = res.rows;
      await startMongo();
    } catch (error) {
      console.error(error);
    } finally {
      pgClient.end();
    }
  }
});

const query = () =>
  new Promise((resolve, reject) => {
    console.info("Querying Postgres DB...");
    pgClient.query(
      `SELECT * 
     FROM public.concept 
     WHERE vocabulary_id = 'LOINC' 
     `,
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      }
    );
  });

async function startMongo() {
  console.info("Start Mongo");
  // Connection URL
  const url = "mongodb://127.0.0.1:27017";
  const dbName = "GPT3_Embeddings";
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    maxPoolSize: 50,
  });

  try {
    await client.connect();
    console.info("Connected to MongoDB");

    const db = client.db(dbName);

    // Set loinc Collection Name for MongoDB collection
    let loincCollectionName = "gpt3_loinc_embeddings";

    // Check if the collection already exists
    console.info(`Create collection ${loincCollectionName} if does not exist`);
    const collections = await db
      .listCollections({ name: loincCollectionName })
      .toArray();
    if (collections.length === 0) {
      // Create a new collection if it doesn't exist
      const collection = await db.createCollection(loincCollectionName);
      console.info("Collection created!");
      await getData(collection);
    } else {
      console.info("Collection already exists");
      await getData(db.collection(loincCollectionName));
    }
  } catch (error) {
    console.error(error);
  } finally {
    // console.log("close client");
    // client.close();
    // process.exit(0);
  }
}

let total = 0;
let barCount = 0;
const bar = new ProgressBar.Bar(
  {
    format:
      "Processing... |{bar}| {percentage}% |  ETA: {eta}s  | {value}/{total}",
  },
  ProgressBar.Presets.shades_classic
);

async function getData(loincDataCollection) {
  let loincNotEmbeddedCount = 0;
  let loincAlreadyEmbeddedCount = 0;
  let loincToEmbedList = [];
  let totalWords = 0;

  let wordBarTotal = pgResults.length;
  let wordBarCount = 0;
  const wordBar = new ProgressBar.Bar(
    {
      format:
        "Processing... |{bar}| {percentage}% |  ETA: {eta}s  | {value}/{total}",
    },
    ProgressBar.Presets.shades_classic
  );

  console.info("Calculating total words...takes a bit of time");
  console.log("Loading to array...");
  wordBar.start(wordBarTotal, 0);
  const loincIds = pgResults.map((elem) => elem.concept_id);

  const projection = { _id: 0, loinc_id: 1 };
  const cursor = loincDataCollection
    .find({ loinc_id: { $in: loincIds } })
    .project(projection);
  const loincResults = await cursor.toArray();

  for (const elem of pgResults) {
    try {
      const result = loincResults.find(
        (res) => res.loinc_id === elem.concept_id
      );
      let words = elem.concept_name.split(" ");
      if (!result) {
        totalWords += words.length;
        loincNotEmbeddedCount++;
        loincToEmbedList.push({
          loinc_id: elem.concept_id,
          loinc_text: elem.concept_name,
        });
      } else {
        loincAlreadyEmbeddedCount++;
      }
      wordBarCount++;
      wordBar.update(wordBarCount);
      if (wordBarCount === wordBarTotal) {
        wordBar.stop();
      }
    } catch (err) {
      console.error(err);
    }
  }

  console.info("Total words", totalWords);
  console.info(
    `You currently have ${loincAlreadyEmbeddedCount} loinc questions text converted and stored in the GPT3 collection`
  );
  console.info(
    "Total loinc Not Stored in GPT3 Embedded Collection",
    loincNotEmbeddedCount
  );
  console.info(
    `Total words to convert ${totalWords} will cost $0.0004 per 1000 tokens for a grand total of ~$` +
      (totalWords / 1000) * 0.0004
  );

  if (loincNotEmbeddedCount == 0) {
    console.info("You already have everything converted!");
    process.exit(0);
  }

  const continueResponse = await prompts({
    type: "confirm",
    name: "value",
    message: `Do you want to continue with this full list of ${loincNotEmbeddedCount} elements to convert?`,
  });
  if (continueResponse.value) {
    console.info("Continuing...");
    //pass sliced list to convert to GPT3 embedding
    total = loincToEmbedList.length;
    bar.start(total, 0);
    const calls = loincToEmbedList.map((element) => {
      return callGPT3(loincDataCollection, element);
    });

    Promise.all(calls)
      .then((results) => {
        console.info("\nAll writes done!");
        // client.close();
        process.exit(0);
      })
      .catch((error) => {
        console.error("Error occurred: ", error);
        process.exit(1);
      });
  } else {
    const limitResponse = await prompts({
      type: "confirm",
      name: "value",
      message: "Do you want to partially convert this list?",
    });
    if (limitResponse.value) {
      console.info("Continuing...");
      const limitAmount = await prompts({
        type: "number",
        name: "value",
        message:
          "Enter the amount you want to convert. This will start at the beginning of the list and end at the amount entered here:",
      });
      if (limitAmount.value) {
        console.info(`Continuing with the first ${limitAmount.value} elements`);
        const sliced = loincToEmbedList.slice(0, limitAmount.value);

        total = sliced.length;
        bar.start(total, 0);
        //pass sliced list to convert to GPT3 embedding
        const calls = sliced.map((element) => {
          return callGPT3(loincDataCollection, element);
        });

        Promise.all(calls)
          .then((results) => {
            console.info("\nAll writes done!");
            // console.info(results)
            // client.close();
            process.exit(0);
          })
          .catch((error) => {
            console.error("Error occurred: ", error);
            process.exit(1);
          });
      } else {
        console.info("No value. Exiting...");
        process.exit();
      }
    } else {
      console.info("No partial. Exiting...");
      process.exit();
    }
  }
}

function callGPT3(loincDataCollection, loincObj) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        "https://api.openai.com/v1/embeddings",
        {
          input: loincObj.loinc_text,
          model: "text-embedding-ada-002",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + gpt3ApiKey,
          },
        }
      )
      .then((response) => {
        barCount++;
        bar.update(barCount);
        if (barCount === total) {
          bar.stop();
        }
        // Store response in gpt_loinc_embeddings collection
        let modData = {
          loinc_id: loincObj.loinc_id,
          gpt3_data: response.data,
          lastModified: new Date(),
          loinc_text: loincObj.loinc_text,
        };
        modData = JSON.stringify(modData);
        // Write the GPT3 response data to backup file in case of error
        fs.appendFileSync("./gpt3/backup/gpt3LoincResponses.json", modData);
        loincDataCollection
          .updateOne(
            { loinc_id: loincObj.loinc_id },
            {
              $set: {
                gpt3_data: response.data,
                lastModified: new Date(),
                loinc_text: loincObj.loinc_text,
              },
            },
            { upsert: true }
          )
          .then((result) => {
            // console.log("Mongo updated!", result);
            resolve();
          })
          .catch((error) => {
            console.info("MongoDB Error", error);
            reject();
          });
      })
      .catch((error) => {
        console.info("Axios POST error", error);
        reject();
        // client.close();
      });
  });
}
