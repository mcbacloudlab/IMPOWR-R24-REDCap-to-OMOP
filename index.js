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
var mysql_pool = require('./db/mysqlConnection.cjs');

let ddMap = [];
initCSVFiles()
readInputCSV()
let totalConceptCallCount = 0
let conceptCallCounter = 0
function readInputCSV(){
  console.log('Read Input CSV...')
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
    // console.log('ddMap', ddMap)
    console.log('Total records of input CSV', csvRowCount)
    
    for (let item of ddMap) {
      for (let ccID of item["Field Annotations"]) {
        if (ccID.trim().substring(0, 1) == "C") {
          // if (ccID.trim() == "C0007457") {
          totalConceptCallCount++
          callUMLSAPI(ccID.trim(), item);
        }
      }
    }
    console.log(`Start calling to get Snomed IDs from UMLS API. ${totalConceptCallCount} calls to make`)  
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

function writeCSVHeader(file, headers){
  //write headers for match file
  fs.appendFile(
    __dirname + file,
    headers,
    function (err, result) {
      if (err) console.log("error", err);
    }
  );
}

function clearFile(file){
  fs.writeFile(__dirname + file, "", function () {
    // console.log("done");
  });
}

function initCSVFiles() {
  console.log('Init CSV files...')
  clearFile("/someData.csv")
  writeCSVHeader("/someData.csv", "UMLS Name/Label,UI,Concept ID,CSV Label,Match Percent\n")

  clearFile("/someDataErr.csv")
  writeCSVHeader("/someDataErr.csv", "FieldLabel,Concept ID\n")

  clearFile("/someDataExtendedErr.csv")
  writeCSVHeader("/someDataExtendedErr.csv", "FieldLabel,Concept ID\n")

  clearFile("/someDataExtended.csv")
  writeCSVHeader("/someDataExtended.csv",  "UMLS Name/Label,UI,CSV C Code,CSV Label,Match,concept_id,concept_name,domain_id,vocabulary_id,concept_class_id,standard_concept,concept_code,valid_start_date,valid_end_date,invalid_reason\n")

  // clearFile("/conceptIDs.csv")
  // writeCSVHeader("/conceptIDs.csv", `UMLS Label/Name,UMLS SNOMED ID,CSV Name/Label,CSV Concept IDs,MatchPercent\n`)

  // clearFile("/conceptIDsErr.csv")
  // writeCSVHeader("/conceptIDsErr.csv",`CSV Name/Label\n`)
}
let lncEmpty = []
function callUMLSAPI(conceptID, itemObj, vocab, errorLookup) {
  let _errorLookup = errorLookup
  let url = process.env.UMLS_API_SNOMED_URL + conceptID
  if(vocab == 'LNC') url = process.env.UMLS_API_LNC_URL + conceptID

  var config = {
    method: "get",
    url: url,
    headers: {},
  };

  axios(config)
    .then(function (response) {
      let data = response.data.result.results;
      
      // console.log(data.length)
      if(vocab == 'LNC' && data.length == 0){
        // console.log('data', data)
        // console.log('concept', conceptID)
        // console.log('itemObj', itemObj)
        if(!lncEmpty.includes(conceptID)) {
          lncEmpty.push(itemObj)
        }
      } 
      let closestMatch = "";
      let tempMaxPercentMatch = 0;
      let textPercentMatch = 0;
      let textMaxIdx = 0;
      let finalMap = [];
      let errorMap = [];
      for (let [index, item] of data.entries()) {
        // console.log('item', item.ui.substring(0,2))
        
        tempMaxPercentMatch = similarity(item.name, itemObj['FieldLabel']);
        if(vocab == 'LNC' && item.ui.substring(0,2) != 'LP') tempMaxPercentMatch = 0
        if (tempMaxPercentMatch >= textPercentMatch) {
          closestMatch = item.name;
          textPercentMatch = tempMaxPercentMatch;
          textMaxIdx = index;
        }
      }

      if (!data[textMaxIdx]) {
        errorMap.push({
          Label: itemObj['FieldLabel'],
          ConceptID: conceptID,
        });
        const errOutput = stringify(errorMap, { header: false });
        fs.appendFile(
          __dirname + "/someDataErr.csv",
          errOutput,
          function (err, result) {
            if (err) console.log("error", err);
            else{
              
            }
            conceptCallCounter++
            if(totalConceptCallCount == conceptCallCounter){
              console.log('All concept calls done! Ended in error')
              //TODO -- before looking up in Athena, we need to try to get LNC ids from UMLS API
              conceptCallCounter = 0
              if(!_errorLookup) {
                umlsErrorLookup()
              }else{
                // console.log('Still missing:')
                // console.log(lncEmpty)
                appendCSV('/someDataExtendedErr.csv', lncEmpty)
                startAthenaLookup()
              }
            }
          }
        );
        return;
      }

      finalMap.push({
        Name: closestMatch,
        Snomed: data[textMaxIdx].ui,
        ConceptIDs: conceptID,
        CSVLabel: itemObj['FieldLabel'],
        MatchPercent: textPercentMatch,
      });

      const output = stringify(finalMap, { header: false });

      fs.appendFile(
        __dirname + "/someData.csv",
        output,
        function (err, result) {
          if (err) console.log("error", err);
          else{
          }
          conceptCallCounter++
          // console.log('conceptCallCounter', conceptCallCounter)
          // console.log('totalConceptCallCount', totalConceptCallCount)
          if(totalConceptCallCount == conceptCallCounter){
            console.log('All concept calls done! Ended in success')
            conceptCallCounter = 0  
            if(!_errorLookup) {
              umlsErrorLookup()
            }else{
              // console.log('Still missing:' + lncEmpty)
              startAthenaLookup()
            }
          }
        }
      );
    })
    .catch(function (error) {
      console.log(error);
    });
}

function appendCSV(filename, data){
  const _data = stringify(data, { header: false });
        fs.appendFile(
          __dirname + filename,
          _data,
          function (err, result) {
            if (err) console.log("error", err);
            return;
          }
        );
}

function umlsErrorLookup(){
  console.log('Start UMLS Error Lookup...')
  let results = []
  let ddMap = []
  totalConceptCallCount = 0
  fs.createReadStream("./someDataErr.csv")
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", () => {
    let csvRowCount = 0;
    for (let item of results) {
      // if (item["Form Name"] == "impowr_demographics") {
        csvRowCount++;
        // ddMap.push(transform(item));
      // }
    }
    // console.log('ddMap', ddMap)
    console.log('Total records of error CSV', csvRowCount)
    
    for (let item of results) {
      // console.log('item', item)
      // for (let ccID of item["Concept ID"]) {
        let ccID = item["Concept ID"];
        if (ccID.trim().substring(0, 1) == "C") {
          // if (ccID.trim() == "C0007457") {
          totalConceptCallCount++
          // console.log('conceptID:', ccID.trim())
          callUMLSAPI(ccID.trim(), item, 'LNC', true);
        }
      // }
    }
    console.log(`Start calling to get LNC from UMLS API. ${totalConceptCallCount} calls to make`)  
  });
}

let totalMySqlQueriesCount = 0
let mysqlComplete = false;
function startAthenaLookup(){
  console.log('Starting Athena lookup...')
  results = [] //clear stream
  ddMap = [] //clear map
  fs.createReadStream("./someData.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      for (let item of results) {
        totalMySqlQueriesCount++
      }
      console.log('Total MySQL Queries:' + totalMySqlQueriesCount)
      for (let item of results) {
        mysqlQuery(item, function(){
          console.log('All MySQL Queries Done')
          mysqlComplete= true
          if(mysqlComplete) {
            console.log('Everything done!')
          }
        })
      }
    });
}
let mysqlInsertCount = 0;
function mysqlQuery(item, callback){
  // execute will internally call prepare and query
  let finalMap = []
  mysql_pool.execute(
    `SELECT * FROM athena.concept where concept_code = ?
    `,
    [item['UI'].trim()],
    function(err, results, fields) {
      if(err) console.log(`Error! ${err}`)
      else{
        for(let i of results){
          for (const [key, value] of Object.entries(i)) {
            item[key] = value
          }
        }

        const output = stringify([item], { header: false });
  
        fs.appendFile(
          __dirname + "/someDataExtended.csv",
          output,
          function (err, result) {
            if (err) console.log("error", err);
            else{

            }
            mysqlInsertCount++
          if(mysqlInsertCount == totalMySqlQueriesCount){
            callback()
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
