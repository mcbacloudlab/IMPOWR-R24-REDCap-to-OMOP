//connects to POSTGres redcap2omop_development/public/concept to get SNOMED text to send to GPT3 API and store reponses in MongoDB

const MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const prompts = require("prompts");
const axiosThrottle = require("axios-request-throttle");
axiosThrottle.use(axios, { requestsPerSecond: 20 }); //GPT3 limit is 3,000 per minute, might need to adjust to avoid any sort of rate limit errors
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
     WHERE vocabulary_id = 'Ethnicity' 
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

    // Set SNOMED Collection Name for MongoDB collection
    let snomedCollectionName = "gpt3_athena_ethnicity_vocab";

    // Check if the collection already exists
    console.info(`Create collection ${snomedCollectionName} if does not exist`);
    const collections = await db
      .listCollections({ name: snomedCollectionName })
      .toArray();
    if (collections.length === 0) {
      // Create a new collection if it doesn't exist
      const collection = await db.createCollection(snomedCollectionName);
      console.info("Collection created!");
      await getData(collection);
    } else {
      console.info("Collection already exists");
      await getData(db.collection(snomedCollectionName));
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

async function getData(snomedDataCollection) {
  let snomedNotEmbeddedCount = 0;
  let snomedAlreadyEmbeddedCount = 0;
  let snomedToEmbedList = [];
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

  console.info("Pre-calculating total words...takes a bit of time");
  console.log("Loading to array...");
  wordBar.start(wordBarTotal, 0);
  const snomedIds = pgResults.map((elem) => elem.concept_id);

  const projection = { _id: 0, snomed_id: 1 };
  const cursor = snomedDataCollection
    .find({ snomed_id: { $in: snomedIds } })
    .project(projection);
  const snomedResults = await cursor.toArray();

  console.log("snomedResults", snomedResults);
  console.log("Loaded to array!");

 // Convert the snomedResults array into a Set for faster lookups
const snomedIdSet = new Set(snomedResults.map(res => res.snomed_id));

for (const elem of pgResults) {
  try {
    // Check if the snomed_id exists in the Set
    const resultExists = snomedIdSet.has(elem.concept_id);
    let words = elem.concept_name.split(" ");
    if (!resultExists) {
      totalWords += words.length;
      snomedNotEmbeddedCount++;
      snomedToEmbedList.push({
        snomed_id: elem.concept_id,
        snomed_text: elem.concept_name,
      });
    } else {
      snomedAlreadyEmbeddedCount++;
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
    `You currently have ${snomedAlreadyEmbeddedCount} snomed questions text converted and stored in the GPT3 collection`
  );
  console.info(
    "Total snomed Not Stored in GPT3 Embedded Collection",
    snomedNotEmbeddedCount
  );
  console.info(
    `Total words to convert ${totalWords} will cost $0.0004 per 1000 tokens for a grand total of ~$` +
      (totalWords / 1000) * 0.0004
  );

  if (snomedNotEmbeddedCount == 0) {
    console.info("You already have everything converted!");
    process.exit(0);
  }

  const continueResponse = await prompts({
    type: "confirm",
    name: "value",
    message: `Do you want to continue with this full list of ${snomedNotEmbeddedCount} elements to convert?`,
  });
  if (continueResponse.value) {
    console.info("Continuing...");
    //pass sliced list to convert to GPT3 embedding
    total = snomedToEmbedList.length;
    bar.start(total, 0);
    const calls = snomedToEmbedList.map((element) => {
      return callGPT3(snomedDataCollection, element);
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
        const sliced = snomedToEmbedList.slice(0, limitAmount.value);

        total = sliced.length;
        bar.start(total, 0);
        //pass sliced list to convert to GPT3 embedding
        const calls = sliced.map((element) => {
          return callGPT3(snomedDataCollection, element);
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

function callGPT3(snomedDataCollection, snomedObj) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        "https://api.openai.com/v1/embeddings",
        {
          input: snomedObj.snomed_text,
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
        // Store response in gpt_snomed_embeddings collection
        let modData = {
          snomed_id: snomedObj.snomed_id,
          gpt3_data: response.data,
          lastModified: new Date(),
          snomed_text: snomedObj.snomed_text,
        };
        modData = JSON.stringify(modData);
        // Write the GPT3 response data to backup file in case of error
        fs.appendFileSync("./gpt3/backup/gpt3responses.json", modData);
        snomedDataCollection
          .updateOne(
            { snomed_id: snomedObj.snomed_id },
            {
              $set: {
                gpt3_data: response.data,
                lastModified: new Date(),
                snomed_text: snomedObj.snomed_text,
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
