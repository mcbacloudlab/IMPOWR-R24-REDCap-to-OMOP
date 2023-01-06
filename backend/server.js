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
const path = require("path");
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

app.get("/get_data_dictionary_list", function (req, res) {
  console.log(
    `Incoming Data Dictionary List GET request at ${new Date().toLocaleString()}`
  );

  const directoryPath = path.join(__dirname, "uploads");
  //passsing directoryPath and callback function
  console.log(directoryPath);
  let fileReturnObject = []
  fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    //listing all files using forEach
    console.log('files', files)
    if(!files.length){
      res.status(200).send({});
    }
    files.forEach(function (file, index) {
      // Do whatever you want to do with the file
      console.log(file);
      // fetch file details
      fs.stat(__dirname + "/uploads/" + file, (err, stats) => {
        if (err) {
          console.log("error!", err);
          // throw err;
        } else {
          // print file last modified date
          let date = new Date(stats.mtime);
          console.log(date.toLocaleString('en-US'));
          date = date.toLocaleString('en-US')
          fileReturnObject.push({
            fileName: file,
            lastModified: date
          })

          
          console.log(`File Data Last Modified: ${stats.mtime}`);
          // console.log(`File Status Last Modified: ${stats.ctime}`);
          if(index === files.length - 1){
            fileReturnObject.sort(function (a,b){
              return new Date(b.lastModified) - new Date(a.lastModified)
            })
            res.status(200).send(fileReturnObject);
          }
        }
      });
    });

  });
});

app.post("/add_data_dictionary", function (req, res) {
  console.log(
    `Incoming Data Dictionary Add POST request at ${new Date().toLocaleString()}`
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
        /* grab the first file */
        const workBook = XLSX.read(req.files.dataFile.data);

        //get first sheet
        const workSheetName = workBook.SheetNames[0];
        const workSheet = workBook.Sheets[workSheetName];
        //convert to array
        const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
        const headers = fileData[0];
        if(!headers.includes('Approved')) headers.push('Approved')
        const heads = headers.map((head) => ({
          accessorKey: head.replaceAll(".", ""),
          header: head.replaceAll(".", ""),
        }));
        ssColDefs = heads;
        //removing header
        fileData.splice(0, 1);
        ssData = convertToJson(headers, fileData);

        //Use the mv() method to place the file in the upload directory (i.e. "uploads")
        // Package and Release Data (`writeFile` tries to write and save an XLSB file)
        // XLSX.writeFile(ssData, "./uploads/" + "Report.csv");
        dataFile.mv("./uploads/" + dataFile.name);
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
});

app.post("/remove_data_dictionary", function (req, res) {
  console.log(
    `Incoming Data Dictionary Remove POST request at ${new Date().toLocaleString()}`
  );

  try {
    if (!req.body.file) {
      res.send({
        status: false,
        message: "No file",
      });
    } else {
        let dataFile = './uploads/' + req.body.file;
        fs.rename(__dirname + '/uploads/' + req.body.file, __dirname + "/deleted/" + req.body.file, (error) =>{
          if(error) console.log(error)
          res.send({
            data: {
              name: dataFile
            },
          });
        });
        
      };
        
  } catch (err) {
    console.log("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
});


app.post("/get_data_dictionary", function (req, res) {
  console.log(
    `Incoming Data Dictionary Add POST request at ${new Date().toLocaleString()}`
  );
  let ssColDefs, ssData, ssFileName;
    console.log(req.body.file)
  try {
    if (!req.body.file) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let dataFile = req.body.file;

      const extensions = ["xlsx", "xls", "csv"];
      const getExtension = (file) => {
        const parts = file.split(".");
        const extension = parts[parts.length - 1];
        return extensions.includes(extension); // return boolean
      };

      const convertToJson = (headers, data) => {
        const rows = [];
        // console.log(headers)
        console.log('data',data)
        // console.log('data', data)
        // let indexList = [0,1,3,4,17,23,24]
        let allowedColumns = ['Form Name', 'Field Label', 'Field Annotation', 'OMOP concept_name']
        data.forEach((row) => {
          let rowData = {};
          // console.log('row', row)
          row.forEach((element, index) => {
            // console.log(headers)
            if(allowedColumns.includes(headers[index])) rowData[headers[index]] = element;
          });
          rows.push(rowData);
        });
        return rows;
      };

      const importExcel = (req) => {
        /* grab the first file */
        const workBook = XLSX.readFile(__dirname + '/uploads/' + dataFile);

        //get first sheet
        const workSheetName = workBook.SheetNames[0];
        const workSheet = workBook.Sheets[workSheetName];
        //convert to array
        const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1,sheetStubs: true });
        console.log('fileData', fileData)
        const headers = fileData[0];
        if(!headers.includes('Approved')) headers.push('Approved')
        const heads = headers.map((head) => ({
          accessorKey: head.replaceAll(".", ""),
          header: head.replaceAll(".", ""),
        }));
        // console.log(heads)
        ssColDefs = heads;
        //removing header
        fileData.splice(0, 1);
        ssData = convertToJson(headers, fileData);
        // console.log('ssData', ssData)
        //send response
        res.send({
          data: {
            name: dataFile,
            data: ssData,
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
});

var server = app.listen(appPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Port to use:", port);
  if (host === "::") host = "localhost";
  console.log("Backend Express Server listening at http://%s:%s", host, port);
});
