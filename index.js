import { createRequire } from "module";
const require = createRequire(import.meta.url);
const csv = require("csv-parser");
const fs = require("fs");
const results = [];
require("dotenv").config();
var axios = require("axios");
import { stringify } from "csv-stringify/sync";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let ddMap = [];
initCSVFiles()
readCSV()

function readCSV(){
fs.createReadStream("./work/IMPOWRREDCapLibrary_DataDictionary_2022-10-23.csv")
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
    for (let item of ddMap) {
      for (let ccID of item["Field Annotations"]) {
        if (ccID.trim().substring(0, 1) == "C") {
          // if (ccID.trim() == "C0007457") {
          callUMLSAPI(ccID.trim(), item);
        }
      }
    }
    // console.log('Total records', csvRowCount)
  });
}

function transform(item) {
  return {
    FieldName: item["Variable / Field Name"],
    FieldLabel: item["Field Label"],
    "Concept IDs": item["concept_id"].split("\n"),
    "Field Annotations": item["Field Annotation"].split(","),
  };
}

function initCSVFiles() {
  //clear files before writing
  fs.writeFile(__dirname + "/someData.csv", "", function () {
    // console.log("done");
  });
  //write headers for match file
  fs.appendFile(
    __dirname + "/someData.csv",
    "UMLS Name/Label, SNOMED UI, Concept ID, CSV Label, Match Percent\n",
    function (err, result) {
      if (err) console.log("error", err);
    }
  );

  fs.writeFile(__dirname + "/someDataErr.csv", "", function () {
    // console.log("done");
  });
  //write headers for error file
  fs.appendFile(
    __dirname + "/someDataErr.csv",
    "CSV Name/Label, Concept ID\n",
    function (err, result) {
      if (err) console.log("error", err);
    }
  );
}

function callUMLSAPI(conceptID, itemObj) {
  // console.log('itemobj', itemObj)
  var config = {
    method: "get",
    url:
      process.env.UMLS_API_URL +
      process.env.UMLS_API_KEY +
      "&string=" +
      conceptID,
    headers: {},
  };

  axios(config)
    .then(function (response) {
      // console.log(response.data.result.results);
      let data = response.data.result.results;
      let closestMatch = "";
      let tempMaxPercentMatch = 0;
      let textPercentMatch = 0;
      let textMaxIdx = 0;
      let finalMap = [];
      let errorMap = [];
      for (let [index, item] of data.entries()) {
        tempMaxPercentMatch = similarity(item.name, itemObj.FieldLabel);
        if (tempMaxPercentMatch >= textPercentMatch) {
          closestMatch = item.name;
          textPercentMatch = tempMaxPercentMatch;
          textMaxIdx = index;
        }
      }
      console.log(
        "Closest match:",
        closestMatch + ":" + textPercentMatch + " at idx:" + textMaxIdx
      );

      if (!data[textMaxIdx]) {
        console.log("Error with API and textMaxIdx: " + conceptID);
        errorMap.push({
          Label: itemObj.FieldLabel,
          ConceptID: conceptID,
        });
        const errOutput = stringify(errorMap, { header: false });
        fs.appendFile(
          __dirname + "/someDataErr.csv",
          errOutput,
          function (err, result) {
            if (err) console.log("error", err);
          }
        );
        return;
      }
      finalMap.push({
        Name: closestMatch,
        Snomed: data[textMaxIdx].ui,
        ConceptIDs: conceptID,
        CSVLabel: itemObj.FieldLabel,
        MatchPercent: textPercentMatch,
      });

      const output = stringify(finalMap, { header: false });

      fs.appendFile(
        __dirname + "/someData.csv",
        output,
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
    })
    .catch(function (error) {
      console.log(error);
    });
}

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
