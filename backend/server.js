const express = require("express");
const app = express();
var axios = require("axios");
var axiosThrottle = require("axios-request-throttle");
axiosThrottle.use(axios, { requestsPerSecond: 5 });
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
var fs = require("fs");
const formidable = require("formidable");
const XLSX = require("xlsx");

let appPort = process.env.EXPRESS_PORT;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("dev"));

// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.post("/add_data_dictionary", function (req, res) {
  console.log(
    `Incoming Data Dictionary Add/Post request at ${new Date().toLocaleString()}`
  );
  let ssColDefs, ssData, ssFileName;

  try {
    if (!req.files) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let dataFile = req.files.dataFile;

      //Use the mv() method to place the file in the upload directory (i.e. "uploads")
      dataFile.mv("./uploads/" + dataFile.name);

      const extensions = ["xlsx", "xls", "csv"];
      const getExtension = (file) => {
        const parts = file.name.split(".");
        const extension = parts[parts.length - 1];
        return extensions.includes(extension); // return boolean
      };

      const convertToJson = (headers, data) => {
        const rows = [];
        data.forEach((row) => {
          let rowData = {};
          row.forEach((element, index) => {
            rowData[headers[index]] = element;
          });
          rows.push(rowData);
        });
        return rows;
      };

      const importExcel = (req) => {
        const file = dataFile.name;
        csvFileName = file.name;
        console.log('start reading spreadsheet')
        console.log(req.files.dataFile)
          /* grab the first file */
          // console.log('files', files)
          // const f = Object.entries(files)[0][1];
          // const path = f.filepath;
          const workBook = XLSX.read(req.files.dataFile.data);
          console.log('got workbook')
          /* DO SOMETHING WITH workbook HERE */
          // const workBook = XLSX.read(bstr, { type: "binary" });

          //get first sheet
          const workSheetName = workBook.SheetNames[0];
          const workSheet = workBook.Sheets[workSheetName];
          //convert to array
          const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
          const headers = fileData[0];
          const heads = headers.map((head) => ({
            accessorKey: head.replaceAll(".", ""),
            header: head.replaceAll(".", ""),
          }));
          console.log('heads', heads)
          ssColDefs = heads;
          //removing header
          fileData.splice(0, 1);
          ssData = convertToJson(headers, fileData);

          console.log("ssData", ssData);
          //send response
          res.send({
            status: true,
            message: "File is uploaded",
            data: {
              name: dataFile.name,
              mimetype: dataFile.mimetype,
              size: dataFile.size,
            },
          });
      };

      if (dataFile) {
        if (getExtension(dataFile)) {
          importExcel(req);
        } else {
          throw new Error("Unsupported File Extension");
        }
      } else {
        ssData = [];
        ssColDefs = [];
      }


    }
  } catch (err) {
    console.log("ERROR!", err);
    res.status(500).send("Something went wrong");
  }

  // { searchText: 'White' }

  //   if (!req.body.searchText) {
  //     res.status(400).send(JSON.stringify("Error"));
  //     return;
  //   }

  //   let searchText = req.body.searchText;

  //   var config = {
  //     method: "get",
  //     url:
  //       process.env.UMLS_API_TEXT_SEARCH_SNOMED_URI +
  //       "&apiKey=" +
  //       process.env.UMLS_API_KEY +
  //       "&string=" +
  //       searchText + "&searchType=approximate",
  //     headers: {},
  //   };

  //   axios(config)
  //     .then(function (response) {
  //       for (let item of response.data.result.results) {
  //         item.similarity = Math.floor(
  //           stringSimilarity.compareTwoStrings(
  //             item.name.toLowerCase(),
  //             searchText.toLowerCase()
  //           ) * 100
  //         );
  //       }
  //       console.log('Sending back data...')
  //       res.send(response.data);
  //     })
  //     .catch(function (error) {
  //       console.log(error);
  //       res.status(500).send(JSON.stringify("Error"));
  //     });
});

var server = app.listen(appPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Port to use:", port);
  if (host === "::") host = "localhost";
  console.log("Backend Express Server listening at http://%s:%s", host, port);
});
