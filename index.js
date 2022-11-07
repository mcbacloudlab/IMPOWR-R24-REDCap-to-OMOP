import { createRequire } from "module";
const require = createRequire(import.meta.url);
const csv = require("csv-parser");
const fs = require("fs");
let results = [];
require("dotenv").config();
var axios = require("axios");
import { stringify } from "csv-stringify/sync";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
var mysql_pool = require("./db/mysqlConnection.cjs");

let ddMap = [];
initCSVFiles();
readInputCSV();
let totalConceptCallCount = 0;
let conceptCallCounter = 0;
function readInputCSV() {
  console.info("Read Input CSV...");
  fs.createReadStream(
    "./work/input/IMPOWRREDCapLibrary_DataDictionary_2022-10-23.csv"
  )
    // fs.createReadStream("./work/input/test.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      let csvRowCount = 0;
      for (let item of results) {
        if (item["Form Name"] == "impowr_demographics") {
          csvRowCount++;
          ddMap.push(transform(item));
        }
      }
      console.info("Total records of input CSV", csvRowCount);
      console.info(
        `Start calling to get Snomed IDs from UMLS API. ${totalConceptCallCount} calls to make`
      );
      for (let item of ddMap) {
        for (let ccID of item["Field Annotations"]) {
          if (ccID.trim().substring(0, 1) == "C") {
            totalConceptCallCount++;
            callUMLSAPI(ccID.trim(), item);
          }
        }
      }
    });
}

function transform(item) {
  return {
    FieldName: item["Variable / Field Name"],
    "CSV Label": item["Field Label"],
    "Concept IDs": item["concept_id"].split("\n"),
    "Field Annotations": item["Field Annotation"].split(","),
  };
}

function writeCSVHeader(file, headers) {
  //write headers for match file
  fs.appendFile(__dirname + file, headers, function (err, result) {
    if (err) console.info("error", err);
  });
}

function clearFile(file) {
  fs.writeFile(__dirname + file, "", function () {});
}

function initCSVFiles() {
  console.info("Init CSV files...");
  clearFile("/work/output/someData.csv");
  writeCSVHeader(
    "/work/output/someData.csv",
    "UMLS Name/Label,UI,Concept ID,CSV Label,Match Percent,Vocab\n"
  );

  clearFile("/work/output/someDataErr.csv");
  writeCSVHeader(
    "/work/output/someDataErr.csv",
    "UMLS Name/Label,UI,Concept ID,CSV Label,Match Percent,Vocab\n"
  );

  clearFile("/work/output/someDataExtendedErr.csv");
  writeCSVHeader(
    "/work/output/someDataExtendedErr.csv",
    "UMLS Name/Label,UI,Concept ID,CSV Label,Match Percent,Vocab\n"
  );

  clearFile("/work/output/someDataExtended.csv");
  writeCSVHeader(
    "/work/output/someDataExtended.csv",
    "UMLS Name/Label,UI,CSV C Code,CSV Label,Match,Vocab,concept_id,concept_name,domain_id,vocabulary_id,concept_class_id,standard_concept,concept_code,valid_start_date,valid_end_date,invalid_reason\n"
  );

}
let lncEmpty = [];
function callUMLSAPI(conceptID, itemObj, vocab, errorLookup, noErr) {
  if (noErr) {
    console.info("No errors to lookup");
    startAthenaLookup(); //no errors to lookup, just start athenaLookup
  }
  let _errorLookup = errorLookup;
  let url = process.env.UMLS_API_SNOMED_URL + conceptID;
  if (!vocab) vocab = "SNOMED";
  if (vocab == "LNC") url = process.env.UMLS_API_LNC_URL + conceptID;

  var config = {
    method: "get",
    url: url,
    headers: {},
  };

  axios(config)
    .then(function (response) {
      let data = response.data.result.results;

      if (vocab == "LNC" && data.length == 0) {
        if (!lncEmpty.includes(conceptID)) {
          itemObj.Vocab += ",LNC";
          lncEmpty.push(itemObj);
        }
      }

      let closestMatch = "";
      let tempMaxPercentMatch = 0;
      let textPercentMatch = 0;
      let textMaxIdx = 0;
      let finalMap = [];
      let errorMap = [];
      for (let [index, item] of data.entries()) {
        tempMaxPercentMatch = similarity(
          item.name,
          itemObj["CSV Label"] ? itemObj["CSV Label"] : itemObj["FieldLabel"]
        );
        if (vocab == "LNC" && item.ui.substring(0, 2) != "LP")
          tempMaxPercentMatch = 0;
        if (tempMaxPercentMatch >= textPercentMatch) {
          closestMatch = item.name;
          textPercentMatch = tempMaxPercentMatch;
          textMaxIdx = index;
        }
      }

      //direct map fix, probably need to make this robust later
      let uiCode = "";
      //write to someDataErr.csv if no results from UMLS API
      if (!data[textMaxIdx]) {
        errorMap.push({
          Name: itemObj["CSV Label"] ? itemObj["CSV Label"] : "No Field Label",
          Snomed: uiCode,
          ConceptIDs: conceptID ? conceptID : "null",
          CSVLabel: itemObj["CSV Label"]
            ? itemObj["CSV Label"]
            : "No Field Label",
          MatchPercent: textPercentMatch ? textPercentMatch : 0,
          Vocab: vocab,
        });
        const errOutput = stringify(errorMap, { header: false });

        fs.appendFile(
          __dirname + "/work/output/someDataErr.csv",
          errOutput,

          function (err, result) {
            if (err) console.info("error", err);
            conceptCallCounter++;
            if (totalConceptCallCount == conceptCallCounter) {
              console.info("All concept calls done! Ended in error");
              //TODO -- before looking up in Athena, we need to try to get LNC ids from UMLS API
              conceptCallCounter = 0;
              if (!_errorLookup) {
                umlsErrorLookup();
              } else {
                appendCSV(
                  "/work/output/someDataExtendedErr.csv",
                  lncEmpty,
                  function () {
                    startAthenaLookup();
                  }
                );
              }
            }
          }
        );
        return;
      }
      finalMap.push({
        Name: closestMatch ? closestMatch : "null",
        Snomed: data[textMaxIdx].ui ? data[textMaxIdx].ui : "null",
        ConceptIDs: conceptID ? conceptID : "null",
        CSVLabel: itemObj["CSV Label"]
          ? itemObj["CSV Label"]
          : "No Field Label",
        MatchPercent: textPercentMatch ? textPercentMatch : 0,
        Vocab: vocab,
      });

      const output = stringify(finalMap, { header: false });

      fs.appendFile(
        __dirname + "/work/output/someData.csv",
        output,
        function (err, result) {
          if (err) console.info("error", err);
          else {
          }
          conceptCallCounter++;
          if (totalConceptCallCount == conceptCallCounter) {
            console.info("All concept calls done! Ended in success");
            conceptCallCounter = 0;
            if (!_errorLookup) {
              umlsErrorLookup();
            } else {
              startAthenaLookup();
            }
          }
        }
      );
    })
    .catch(function (error) {
      console.info(error);
    });
}

function callUMLSAltLookup(conceptID, itemObj, vocab, noErr) {}

function appendCSV(filename, data, callback) {
  const _data = stringify(data, { header: false });
  fs.appendFile(__dirname + filename, _data, function (err, result) {
    if (err) console.info("error", err);
    console.info(`${filename} wrote. Callback now`);
    callback();
  });
}

function umlsErrorLookup() {
  console.info("Start UMLS Error Lookup...");
  let results = [];
  let ddMap = [];
  totalConceptCallCount = 0;
  fs.createReadStream("./work/output/someDataErr.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      let csvRowCount = 0;
      for (let item of results) {
        csvRowCount++;
      }

      console.info("Total records of error CSV", csvRowCount);

      for (let item of results) {
        let ccID = item["Concept ID"];
        if (ccID.trim().substring(0, 1) == "C") {
          totalConceptCallCount++;
          callUMLSAPI(ccID.trim(), item, "LNC", true, false);
        }
      }
      if (!totalConceptCallCount) callUMLSAPI(null, null, null, null, true); //no errors to lookup
      console.info(
        `Start calling to get LNC from UMLS API. ${totalConceptCallCount} calls to make`
      );
    });
}

let totalMySqlQueriesCount = 0;
let mysqlComplete = false;
function startAthenaLookup() {
  console.info("Starting Athena lookup...");
  results = []; //clear stream
  ddMap = []; //clear map
  fs.createReadStream("./work/output/someData.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      for (let item of results) {
        totalMySqlQueriesCount++;
      }
      console.info("Total MySQL Queries:" + totalMySqlQueriesCount);
      for (let item of results) {
        mysqlQuery(item, function () {
          console.info("All MySQL Queries Done");
          mysqlComplete = true;
          if (mysqlComplete) {
            console.info("Everything done!");
          }
        });
      }
    });
}
let mysqlInsertCount = 0;
function mysqlQuery(item, callback) {
  // execute will internally call prepare and query
  let finalMap = [];

  let concept_code = item["UI"];
  mysql_pool.execute(
    `SELECT * FROM athena.concept where concept_code = ?
    `,
    [concept_code.trim()],
    function (err, results, fields) {
      if (err) console.info(`Error! ${err}`);
      else {
        for (let i of results) {
          for (const [key, value] of Object.entries(i)) {
            item[key] = value;
          }
        }
        const output = stringify([item], { header: false });
        fs.appendFile(
          __dirname + "/work/output/someDataExtended.csv",
          output,
          function (err, result) {
            if (err) console.info("error", err);
            else {
            }
            mysqlInsertCount++;
            if (mysqlInsertCount == totalMySqlQueriesCount) {
              callback();
            }
          }
        );
      }
    }
  );
}

//Levenshtein Distance
function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
