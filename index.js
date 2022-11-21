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
import { start } from "repl";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
var mysql_pool = require("./db/mysqlConnection.cjs");

let ddMap = [];
initCSVFiles();
readInputCSV();
let totalConceptCallCount = 0;
let conceptCallCounter = 0;
let allCUICodes = [];
let foundCUICodes = [];
let vocabPriorityList = ['SNOMEDCT_US', 'LNC', 'MSH', 'NCI', 'MEDCIN', 'CCPSS', 'NANDA-I'] //order of API vocab checks
function readInputCSV() {
  console.info("Read Input CSV...");
  fs.createReadStream("./work/input/IMPOWRREDCapLibrary_DataDictionary_2022-10-23.csv")
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

      for (let item of ddMap) {
        for (let ccID of item["Field Annotations"]) {
          if (ccID.substring(0, 1) == "C") {
            totalConceptCallCount++;
            allCUICodes.push(ccID)
            callUMLSAPI(ccID, item);
          }
        }
      }
      console.info(
        `\n*****\nStart calling to get Snomed IDs from UMLS API. ${totalConceptCallCount} calls to make`
      );
    });
}

function transform(item) {
  let ccIDs = item["Field Annotation"].split(",").map(element => element.trim())
  //can directly add CUI code corrections here to patchObj
  let patchObj = [
      // {'C0011292':'C1830323'},
      // {'C123': 'C45'}
    ]
    let patchCNumIdx
    for (var i in patchObj){
      for (var key in patchObj[i]){
        patchCNumIdx = ccIDs.indexOf(key)
        if(patchCNumIdx >= 0){
          ccIDs[patchCNumIdx] = patchObj[i][key]
        }
      }
  }
  

  return {
    FieldName: item["Variable / Field Name"],
    "CSV Label": item["Field Label"],
    "Concept IDs": item["concept_id"].split("\n"),
    "Field Annotations": ccIDs,
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
  clearFile("/work/output/outputData.csv");
  writeCSVHeader(
    "/work/output/outputData.csv",
    "UMLS Name/Label,UI,Concept ID,CSV Label,Match Percent,Vocab\n"
  );

  clearFile("/work/output/outputDataErr.csv");
  writeCSVHeader(
    "/work/output/outputDataErr.csv",
    "UMLS Name/Label,UI,Concept ID,CSV Label,Match Percent,Vocab\n"
  );

  clearFile("/work/output/outputDataExtendedErr.csv");
  writeCSVHeader(
    "/work/output/outputDataExtendedErr.csv",
    "UMLS Name/Label,UI,Concept ID,CSV Label,Match Percent,Vocab\n"
  );

  clearFile("/work/output/outputDataExtended.csv");
  writeCSVHeader(
    "/work/output/outputDataExtended.csv",
    "UMLS Name/Label,UI,CSV C Code,CSV Label,Match,Vocab,concept_id,concept_name,domain_id,vocabulary_id,concept_class_id,standard_concept,concept_code,valid_start_date,valid_end_date,invalid_reason\n"
  );

}
let lncEmpty = [];


//this function gets called multiple times, first call is for SNOMED and then LNC
function callUMLSAPI(conceptID, itemObj, vocab, errorLookup, noErr, lastErrorCheck) {
  if (noErr) {
    console.info("No errors to lookup");
    startAthenaLookup(); //no errors to lookup, just start athenaLookup
  }
  if (!vocab) vocab = "SNOMEDCT_US";
  let url = process.env.UMLS_API_URI + '&sabs=' + vocab + '&string=' + conceptID

  var config = {
    method: "get",
    url: url,
    headers: {},
  };

  axios(config)
    .then(function (response) {
      let data = response.data.result.results;

      if (vocab != "SNOMEDCT_US" && data.length == 0) {
        if (!lncEmpty.includes(conceptID)) {
          itemObj.Vocab += "," + vocab;
          lncEmpty.push(itemObj);
        }
      }

      let closestMatch = "";
      let tempMaxPercentMatch = 0;
      let textPercentMatch = 0;
      let textMaxIdx = 0;
      let finalMap = [];
      let errorMap = [];
      let priorityPick = false
      for (let [index, item] of data.entries()){
        tempMaxPercentMatch = similarity(
          item.name,
          itemObj["CSV Label"] ? itemObj["CSV Label"] : itemObj["FieldLabel"]
        );
        if(vocab == 'LNC' && item.ui.substring(0,2) == 'LP') { //athena dictionary only has LP concept codes
          console.log('priority! for', item.ui)
          priorityPick = true
        } 
        
        if(priorityPick){
          closestMatch = item.name;
          textPercentMatch = tempMaxPercentMatch;
          textMaxIdx = index;
          break; //jump out of loop, already found priority
        } else if (tempMaxPercentMatch >= textPercentMatch) {
          closestMatch = item.name;
          textPercentMatch = tempMaxPercentMatch;
          textMaxIdx = index;
        }
      }

      //direct map fix, probably need to make this robust later
      let uiCode = "";
      //write to outputDataErr.csv if no results from UMLS API
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
          __dirname + "/work/output/outputDataErr.csv",
          errOutput,

          function (err, result) {
            if (err) console.info("error", err);
            conceptCallCounter++;
            if (totalConceptCallCount == conceptCallCounter) {
              console.info("All concept calls done! Ended in error. \n*****");
              //TODO -- before looking up in Athena, we need to try to get LNC ids from UMLS API
              conceptCallCounter = 0;
              if (!lastErrorCheck) {
                umlsErrorLookup();
              } else {
                startAthenaLookup()
              }
            }
          }
        );
        return;
      }
      let _vocab = vocab
      if(vocab == 'text') _vocab = data[textMaxIdx].rootSource
      finalMap.push({
        Name: closestMatch ? closestMatch : "null",
        Snomed: data[textMaxIdx].ui ? data[textMaxIdx].ui : "null",
        ConceptIDs: conceptID ? conceptID : "null",
        CSVLabel: itemObj["CSV Label"]
          ? itemObj["CSV Label"]
          : "No Field Label",
        MatchPercent: textPercentMatch ? textPercentMatch : 0,
        Vocab: _vocab,
      });

      const output = stringify(finalMap, { header: false });

      fs.appendFile(
        __dirname + "/work/output/outputData.csv",
        output,
        function (err, result) {
          if (err) console.info("error", err);

          conceptCallCounter++;
          if (totalConceptCallCount == conceptCallCounter) {
            console.info("All concept calls done! Ended in success");
            conceptCallCounter = 0;
            if (!lastErrorCheck) {
              umlsErrorLookup();
            } else {
              startAthenaLookup()
            }
          }
        }
      );
    })
    .catch(function (error) {
      console.info(error);
    });
}


function appendCSV(filename, data, callback) {
  results = [] //clear read stream
  const _data = stringify(data, { header: false });
  fs.appendFile(__dirname + filename, _data, function (err, result) {
    if (err) console.info("error", err);
    // console.info(`${filename} wrote. Callback now`);
    callback();
  });
}

//after trying to lookup using C codes provided, try text search
function callUMLSTextAPI(){
  console.info("\n*****\nStart UMLS Text Error Lookup...");
  let results = [];
  totalConceptCallCount = 0;
  fs.createReadStream("./work/output/outputDataExtendedErr.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      let csvRowCount = 0;
      for (let item of results) {
        csvRowCount++;
      }

      console.info("Total records of text error CSV", csvRowCount);

      for (let item of results) {
        let ccID = item["Concept ID"];
        if (ccID.substring(0, 1) == "C") {
          totalConceptCallCount++;
          callUMLSAPI(ccID, item, 'text', true, false);
        }
      }
      // if (!totalConceptCallCount) callUMLSAPI(null, null, null, null, true); //no errors to lookup
      console.info(
        `Start calling to get text lookups from UMLS API. ${totalConceptCallCount} calls to make...`
      );
    });
}

let umlsErrLookupCount = 0
let lastErr = false
function umlsErrorLookup() {
  console.info("\n*****\nStart UMLS Error Lookup...");
  umlsErrLookupCount++
  let err_codes = []
  for(let i = 0; i<vocabPriorityList.length;i++){
    // console.log(vocabPriorityList[i])
    if(i) err_codes.push(vocabPriorityList[i])
  }
  let errLookUpCode = err_codes[umlsErrLookupCount - 1] 
  if(err_codes.length == umlsErrLookupCount) lastErr = true
  console.info(`Looking up ${errLookUpCode}`)
  
  let results = [];
  totalConceptCallCount = 0;
  fs.createReadStream("./work/output/outputDataErr.csv")
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
        if (ccID.substring(0, 1) == "C" && item['Vocab'] == vocabPriorityList[umlsErrLookupCount - 1]) { //only lookup previous API vocab errors
          totalConceptCallCount++;
          callUMLSAPI(ccID, item, errLookUpCode, true, false, lastErr);
        }
      }
      if (!totalConceptCallCount) callUMLSAPI(null, null, null, null, true); //no errors to lookup
      console.info(
        `Start calling to get ${errLookUpCode} from UMLS API. ${totalConceptCallCount} calls to make...`
      );
    });
}

let totalMySqlQueriesCount = 0;
let mysqlComplete = false;
function startAthenaLookup() {
  console.info("\n*****\nStarting Athena lookup...");
  results = []; //clear stream
  // ddMap = []; //clear map
  fs.createReadStream("./work/output/outputData.csv")
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
            errorReport() //generate error report, compare found cui codes to all cui codes
            // console.info("Everything done!\n**********");
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
    [concept_code],
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
          __dirname + "/work/output/outputDataExtended.csv",
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

function errorReport(){
  console.info('*****')
  console.info('Start error report')
  let lastErrCode = vocabPriorityList[vocabPriorityList.length - 1]
  console.info('Last error code is: ' + lastErrCode)
  console.info('All CUI Codes', allCUICodes.length)
  results = [] //clear read stream
  //compare found cui codes to original allCui codes
  console.info("Read Input CSV...");
  fs.createReadStream("./work/output/outputDataExtended.csv")
    // fs.createReadStream("./work/input/test.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      //count total found CUI codes
      for (let item of results) {
        if (item["UI"]) {
          foundCUICodes.push(item['CSV C Code']);
        }
      }
      // console.log(ddMap)
      console.info('FoundCUICodes', foundCUICodes.length)
      if(allCUICodes.length - foundCUICodes.length == 0) {
        console.info('All codes found! No error report necessary.')
        process.exit(0)
      }
      // if(foundCUICodes.length < allCUICodes.length) console.info("CUI codes not found:", allCUICodes.length - foundCUICodes.length)
      // else console.info('Something weird happened. Found counts make no sense.')
      
      //the initial error file will contain the last not found. 
    // since the API calls output to the error file with the vocab used. It will be the records where the last element in vocabPriorityList is listed under the vocab column
    results = [] //clear results
    let errorCount = 0
    fs.createReadStream("./work/output/outputDataErr.csv")
    // fs.createReadStream("./work/input/test.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      for (let item of results) {
        // console.log('item', item)
        let errArr = []
        
        if (item["Vocab"] == vocabPriorityList[vocabPriorityList.length - 1]) {
          errArr.push(item)
          appendCSV(
                "/work/output/outputDataExtendedErr.csv",
                errArr,
                function () {
                  errorCount++
                  if(errorCount == allCUICodes.length - foundCUICodes.length){
                    console.log('Error report generated. Everything done!')
                    process.exit(0)
                  }
                  // if(vocab != 'text') callUMLSTextAPI();
                  // else startAthenaLookup();
                  // console.log('appended to error csv!')
                  // startAthenaLookup()
                }
              );
        }
      }
      // console.log(ddMap)
      // console.log('foundCUICodes', foundCUICodes.length)
      console.info("CUI codes not found:", allCUICodes.length - foundCUICodes.length)
    });


    });

    
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
