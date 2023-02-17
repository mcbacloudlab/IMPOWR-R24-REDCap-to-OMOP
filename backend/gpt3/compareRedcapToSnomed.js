const MongoClient = require("mongodb").MongoClient;
const cosineSimilarity = require("compute-cosine-similarity");
var eDistance = require("euclidean-distance");
const ProgressBar = require("cli-progress");
const Excel = require("exceljs");
var axios = require("axios");
const axiosThrottle = require("axios-request-throttle");
axiosThrottle.use(axios, { requestsPerSecond: 150 }); //UMLS API limit is 20 requests per second
require("dotenv").config();
// Connection URL
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, { useNewUrlParser: true, maxPoolSize: 50 });

async function main() {
  await client.connect();
  console.info("Connected successfully to MongoDB server");
}

main().then(async () => {
  //Load MongoDB Collections into memory/arrays
  const redcapCollection = client
    .db("GPT3_Embeddings")
    .collection("gpt3_redcap_embeddings");
  const redCapCollectionArray = await loadCollection(redcapCollection);
  console.info("Loaded Redcap Collection into memory");
  const snomedCollection = client
    .db("GPT3_Embeddings")
    .collection("gpt3_snomed_embeddings");
  console.info("Loading SNOMED Collection into memory...");
  // const snomedCollectionArray = await loadCollection(snomedCollection);
  let snomedCollectionArray = []
  const cursor = snomedCollection.find({});
  for await (const doc of cursor) {
    snomedCollectionArray.push(doc)
  }
  console.info("Loaded SNOMED Collection into memory");

  //process the MongoDB arrays and return to finalList
  let excelOutput = await startProcessing(
    redCapCollectionArray,
    snomedCollectionArray
  );

  //   excelOutput = await getMoreInfo(excelOutput);
  //   excelOutput = await countCUI_Overlaps(excelOutput);
  //close MongoDB conneciton
  client.close();
  //output to Excel
  writeExcelFile(excelOutput);
});

async function loadCollection(collection) {
  return new Promise((resolve, reject) => {
    let collectionArray = [];
    // Code to load the entire collection into the array
    collection.find().toArray((error, docs) => {
      if (error) {
        reject(error);
      } else {
        collectionArray = docs;
        resolve(collectionArray);
      }
    });
  });
}

const { Worker } = require("worker_threads");

async function startProcessing(redCapCollectionArray, snomedCollectionArray) {
  let numWorkers = require("os").cpus().length; // Get the number of available cores
  numWorkers = 1
  const chunkSize = Math.ceil(redCapCollectionArray.length / numWorkers);
  const workers = [];
  const finalList = [];
  const progress = { count: 0 };
  const startProcTime = Date.now();

  console.info(
    "Calculating top similarities between Redcap Text and SNOMED text..."
  );
  let barTotal = redCapCollectionArray.length;
  const bar = new ProgressBar.Bar(
    {
      format: "Processing... |{bar}| {percentage}% |  ETA: {eta}s  | {value}/{total}",
    },
    ProgressBar.Presets.shades_classic
  );
  bar.start(barTotal, 0);

  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const workerData = {
      redCapCollectionArray: redCapCollectionArray.slice(start, end),
      snomedCollectionArray: snomedCollectionArray,
      progress: progress,
    };
    const worker = new Worker("./gpt3/compareRedcapToSnomed_worker.js", { workerData });
    workers.push(worker);

    worker.on("message", (message) => {
      if (message.progress) {
        progress.count += message.progress;
        bar.update(progress.count);
        if (progress.count === barTotal) {
          bar.stop();
        }
      } else {
        finalList.push(...message);
      }
    });

    worker.on("error", (error) => {
      console.error(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  }

  await Promise.all(
    workers.map((worker) => {
      return new Promise((resolve) => {
        worker.on("exit", resolve);
      });
    })
  );

  const totalProcTime = Date.now() - startProcTime;
  console.info("Total processing time:", totalProcTime / 1000 + " secs");
  redCapCollectionArray = [];
  snomedCollectionArray = [];
  return finalList;
}

function writeExcelFile(data) {
  console.info("Writing Excel Report...");
  const workbook = new Excel.stream.xlsx.WorkbookWriter({
    filename: "./gpt3/compareOutput/data.xlsx",
  });
  const worksheet = workbook.addWorksheet("Data");

  worksheet.columns = [
    { header: "REDCap Question", key: "redcapFieldLabel", width: 35 },
    { header: "SNOMED Text", key: "snomedText", width: 35 },
    { header: "SNOMED ID", key: "snomedID", width: 35 },
    { header: "Cosine Similarity", key: "similarity", width: 35 },
    { header: "Euclidean Distance", key: "eDistance", width: 35 },
  ];

  data.forEach((outerArr) => {
    outerArr.forEach((obj) => {
      worksheet
        .addRow({
          redcapFieldLabel: obj.redcapFieldLabel,
          snomedText: obj.snomedText,
          snomedID: `https://athena.ohdsi.org/search-terms/terms/${obj.snomedID}`,
          similarity: obj.similarity,
          eDistance: obj.eDistance,
        })
        .getCell("snomedID").value = {
        text: `https://athena.ohdsi.org/search-terms/terms/${obj.snomedID}`,
        hyperlink: `https://athena.ohdsi.org/search-terms/terms/${obj.snomedID}`,
      };
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.commit();
  workbook.commit();
  console.info("Excel file wrote");
}

function removeEmptyArray(array) {
  let clean = "";
  if (array == undefined || array.length === 0) clean = "";
  else clean = array;
  return clean;
}

//Gets more info from redcap_data and snomed_data MongoDB collections on top cosine similarity snomed results
async function getMoreInfo(finalList) {
  const promises = [];
  finalList.forEach((elem) => {
    elem.forEach((obj) => {
      promises.push(
        new Promise((resolve, reject) => {
          client
            .db("GPT3_Embeddings")
            .collection("cde_data")
            .findOne({ tinyId: obj.cdeTinyID }, function (err, result) {
              if (err) reject(err);
              obj.dataType = result.valueDomain.datatype;
              if (result.valueDomain.datatype === "Number") {
                obj.permissibleValues = result.valueDomain.datatypeNumber;
              } else {
                obj.permissibleValues = result.valueDomain.permissibleValues;
              }
              obj.dataElementConcepts = []; //init for concepts
              if (result.dataElementConcept.concepts.length > 0) {
                obj.dataElementConcepts.push(
                  result.dataElementConcept.concepts
                );
              }
              if (result.property.concepts.length > 0) {
                // if(obj.dataElementConcepts.length > 0)
                obj.dataElementConcepts.push(result.property.concepts);
                // else obj.dataElementConcepts = (result.property.concepts)
              }
              if (result.objectClass.concepts.length > 0) {
                // if(obj.dataElementConcepts.length > 0)
                obj.dataElementConcepts.push(result.objectClass.concepts);
                // else obj.dataElementConcepts = (result.objectClass.concepts)
              }

              let flattenedArray;
              //flatten into just array of objects
              if (obj.dataElementConcepts.length > 0) {
                let arr = obj.dataElementConcepts;
                flattenedArray = arr.reduce(
                  (acc, curr) => [...acc, ...curr],
                  []
                );
                obj.dataElementConcepts = flattenedArray;
              }

              client
                .db("GPT3_Embeddings")
                .collection("redcap_data")
                .findOne(
                  {
                    fileName: obj.redCapKeys.redCapFileName,
                    "Form Name": obj.redCapKeys.redCapFormName,
                    "Variable / Field Name": obj.redCapKeys.redCapVariableName,
                  },
                  function (err, result) {
                    if (err) reject(err);
                    obj.redCapPermissibleValues =
                      result.doc["Choices, Calculations, OR Slider Labels"];
                    obj.redCapFieldType = result.doc["Field Type"];
                    obj.fieldAnnotation = result.doc["Field Annotation"];
                    resolve();
                  }
                );
            });
        })
      );
    });
  });
  await Promise.all(promises);
  return finalList;
}

//Gets more info from redcap_data and cde_data MongoDB collections on top cosine similarity CDE results
const Bottleneck = require("bottleneck");

const limiter = new Bottleneck({
  maxConcurrent: 10,
  minTime: 1000 / 15, // wait per request in ms
});

async function countCUI_Overlaps(data) {
  let annotationArray;
  let umlsAPICounter = 0;
  let umlsResponsesReceived = 0;

  const bar = new ProgressBar.Bar(
    {
      format: "Processing... |{bar}| {percentage}% || {value}/{total}",
    },
    ProgressBar.Presets.shades_classic
  );

  let errorRetryLimit = 100;
  let errorCounter = 0;
  let umlsConceptResponses = [];
  //UMLS API caller, on error it adds this call again until the errorRetryLimit is hit
  console.info("Calling UMLS API...");
  const retryAxiosCall = (config, obj) => {
    return limiter
      .schedule(() => axios(config))
      .then(function (response) {
        umlsResponsesReceived++;
        bar.update(umlsResponsesReceived);
        if (umlsResponsesReceived === umlsAPICounter) {
          bar.stop();
        }
        if (response.data.result.results.length) {
          if (response.data.result.results[0].ui) {
            obj.conceptUMLSResponses.push(response.data.result.results[0].ui);
          }
        }
        return;
      })
      .catch(function (error) {
        console.info("\nError in UMLS API call.");
        if (errorCounter <= errorRetryLimit) {
          console.info("Retrying...");
          umlsConceptResponses.push(retryAxiosCall(config, obj));
        }
        errorRetryLimit++;
        errorCounter++;
        return;
      });
  };

  return new Promise(async (resolve, reject) => {
    let umlsResponses = [];

    let failedResponsesPromises = [];
    for (const dataElem of data) {
      for (const obj of dataElem) {
        if (obj.fieldAnnotation) {
          annotationArray = obj.fieldAnnotation.replaceAll(" ", "").split(",");
          obj.fieldAnnotation = annotationArray.filter((elem) =>
            elem.startsWith("C")
          );
        }

        //Here we convert the permissible LOINC and NCI codes in CDE to UMLS CUI codes to be able to compare against what is entered in the REDCap data dictionary
        //Not using permissible values at the moment
        if (false) {
          if (obj.permissibleValues && obj.permissibleValues.length > 0) {
            obj.permissUMLSResponses = [];
            for (const pvElem of obj.permissibleValues) {
              if (
                pvElem.codeSystemName === "LOINC" ||
                pvElem.codeSystemName === "NCI Thesaurus"
              ) {
                const config = {
                  method: "get",
                  maxBodyLength: Infinity,
                  url: `https://uts-ws.nlm.nih.gov/rest/search/current?string=${pvElem.valueMeaningCode}&apiKey=${process.env.UMLS_API_KEY}`,
                  headers: {},
                };
                umlsAPICounter++;
                umlsResponses.push(
                  limiter
                    .schedule(() => axios(config))
                    .then(function (response) {
                      umlsResponsesReceived++;
                      bar.update(umlsResponsesReceived);
                      if (umlsResponsesReceived === umlsAPICounter) {
                        bar.stop();
                      }
                      if (response.data.result.results.length) {
                        if (response.data.result.results[0].ui) {
                          obj.permissUMLSResponses.push(
                            response.data.result.results[0].ui
                          );
                        }
                      }
                    })
                );
              }
            }
          }
        }
        //Here we convert the concept NCI codes in CDE to UMLS CUI codes to be able to compare against what is entered in the REDCap data dictionary
        if (obj.dataElementConcepts && obj.dataElementConcepts.length > 0) {
          obj.conceptUMLSResponses = [];
          for (const pvElem of obj.dataElementConcepts) {
            if (true) {
              const config = {
                method: "get",
                maxBodyLength: Infinity,
                url: `https://uts-ws.nlm.nih.gov/rest/search/current?string=${pvElem.originId}&apiKey=${process.env.UMLS_API_KEY}`,
                headers: {},
              };
              umlsAPICounter++;
              umlsConceptResponses.push(retryAxiosCall(config, obj));
            }
          }
        }
      }
    }

    console.info("Total UMLS API Calls To Make: ", umlsAPICounter);
    bar.start(umlsAPICounter, 0);
    await Promise.all(umlsResponses);
    await Promise.all(umlsConceptResponses);
    await Promise.all(failedResponsesPromises);

    console.info("UMLS Counter: ", umlsAPICounter);
    console.info("UMLS Received", umlsResponsesReceived);
    if (umlsAPICounter == umlsResponsesReceived) {
      console.log("Finally! We have all UMLS Responses.");
    }
    console.info("All promises and API calls resolved!");

    //Now everything has been converted to UMLS CUI codes, we can compare to what was entered in REDCap data dictionary (obj.fieldAnnotation) and insert into our object to return
    for (const dataElem of data) {
      for (const obj of dataElem) {
        let permissOverlaps = 0;
        if (obj.permissUMLSResponses) {
          obj.permissUMLSResponses.forEach((umlsResponse) => {
            if (obj.fieldAnnotation) {
              if (obj.fieldAnnotation.includes(umlsResponse)) {
                permissOverlaps++;
              }
            }
          });
          obj.permissCuiOverlaps = permissOverlaps;
        }
        let conceptOverlaps = 0;
        if (obj.conceptUMLSResponses) {
          obj.conceptUMLSResponses.forEach((umlsResponse) => {
            if (obj.fieldAnnotation) {
              if (obj.fieldAnnotation.includes(umlsResponse)) {
                conceptOverlaps++;
              }
            }
          });
          obj.conceptCuiOverlaps = conceptOverlaps;
        }

        //how many CUI codes entered in REDCap data dictionary
        if (obj.fieldAnnotation) {
          obj.numCuiCodesRedCap = obj.fieldAnnotation.length
            ? obj.fieldAnnotation.length
            : "";
        }

        if (obj.permissibleValues) {
          obj.permissNum = obj.permissibleValues.length;
        }

        if (obj.dataElementConcepts) {
          obj.conceptNum = obj.dataElementConcepts.length;
        }

        if (obj.permissUMLSResponses) {
          obj.permissNumUMLSResponses = obj.permissUMLSResponses.length
            ? obj.permissUMLSResponses.length
            : "";
        }

        if (obj.conceptUMLSResponses) {
          obj.conceptNumUMLSResponses = obj.conceptUMLSResponses.length
            ? obj.conceptUMLSResponses.length
            : "";
        }

        //calc permiss match percent
        if (obj.permissCuiOverlaps && obj.permissUMLSResponses.length) {
          obj.permissMatchPercent =
            obj.permissCuiOverlaps / obj.permissUMLSResponses.length;
        }

        //calc concept match percent
        if (obj.conceptCuiOverlaps && obj.conceptUMLSResponses.length) {
          obj.conceptMatchPercent =
            (obj.conceptCuiOverlaps / obj.conceptUMLSResponses.length) * 100;
        }
      }
    }

    resolve(data);
  });
}
