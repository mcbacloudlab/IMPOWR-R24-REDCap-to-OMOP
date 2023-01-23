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
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(morgan("dev"));

// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

async function getFileDetails(files, readDir) {
  if (!readDir) readDir = __dirname + "/uploads/";

  const filePromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      fs.stat(readDir + file, (err, stats) => {
        if (err) {
          return reject(err);
        }
        let date = new Date(stats.mtime);
        date = date.toLocaleString("en-US");
        resolve({
          fileName: file,
          lastModified: date,
        });
      });
    });
  });

  const fileDetails = await Promise.all(filePromises);
  return fileDetails;
}

app.get("/get_data_dictionary_list", function (req, res) {
  // const directoryPath = path.join(__dirname, "uploads");
  console.log("req", req.query);
  console.log(req.query.archived);
  let readDir;
  if (req.query.archived) {
    console.log("get del");
    readDir = __dirname + "/deleted/";
  } else {
    console.log("get uploads");
    readDir = __dirname + "/uploads/";
  }
  console.log("readDir", readDir);
  fs.readdir(readDir, async (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading files");
    }
    const fileDetails = await getFileDetails(files, readDir);
    fileDetails.sort(
      (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
    );
    res.status(200).send(fileDetails);
  });
});

app.post("/add_data_dictionary", function (req, res) {
  const directoryPath = path.join(__dirname, "uploads");

  try {
    if (!req.files) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let dataFile = req.files.dataFile;

      //first check to see if filename already exists
      //passsing directoryPath and callback function
      fs.readdir(__dirname + "/uploads/", async (err, files) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error reading files");
        }
        const fileDetails = await getFileDetails(files);
        const exists = fileDetails.some(
          (item) => item["fileName"] === req.files.dataFile.name
        );
        if (exists) {
          res.status(500).send({
            status: false,
            message: "File already exists",
          });
        } else {
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
      });

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
          row.push("");
          for (let i = 0; i < row.length; i++) {
            rowData[headers[i]] = row[i];
          }
          rows.push(rowData);
        });

        //append approved to final rows
        rows.forEach((row, index) => {
          if (!row["Approved"]) row["Approved"] = "";
          if (index == Object.keys(rows).length - 1) {
            var worksheet2 = XLSX.utils.json_to_sheet(rows);
            let workbook2 = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook2, worksheet2, "Dates");
            XLSX.writeFile(workbook2, "./uploads/" + dataFile.name, {
              compression: true,
            });
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
            return rows;
          }
        });
      };

      const importExcel = (req) => {
        const file = dataFile.name;
        csvFileName = file.name;
        const workBook = XLSX.read(req.files.dataFile.data);

        //get first sheet
        const workSheetName = workBook.SheetNames[0];
        const workSheet = workBook.Sheets[workSheetName];
        //convert to array
        const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
        const headers = fileData[0];
        if (!headers.includes("Approved")) headers.push("Approved");
        const heads = headers.map((head) => ({
          accessorKey: head.toString().replaceAll(".", ""),
          header: head.toString().replaceAll(".", ""),
        }));
        ssColDefs = heads;
        //removing header
        fileData.splice(0, 1);
        ssData = convertToJson(headers, fileData);

        //Use the mv() method to place the file in the upload directory (i.e. "uploads")
        // Package and Release Data (`writeFile` tries to write and save an XLSB file)
        // XLSX.writeFile(ssData, "./uploads/" + "Report.csv");
        // dataFile.mv("./uploads/" + dataFile.name, (err) => {
        //   if (err) throw err;
        //   else {
        //     //send response
        //     res.send({
        //       status: true,
        //       message: "File is uploaded",
        //       data: {
        //         name: dataFile.name,
        //         mimetype: dataFile.mimetype,
        //         size: dataFile.size,
        //       },
        //     });
        //   }
        // });
      };
    }
  } catch (err) {
    console.error("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/remove_data_dictionary", function (req, res) {
  try {
    if (!req.body.file) {
      res.send({
        status: false,
        message: "No file",
      });
    } else {
      let dataFile = "./uploads/" + req.body.file;
      fs.rename(
        __dirname + "/uploads/" + req.body.file,
        __dirname +
          "/deleted/" +
          new Date().toJSON().slice(0, 23).replaceAll(":", "_") +
          "_" +
          req.body.file,
        (error) => {
          if (error) console.error(error);
          res.send({
            data: {
              message: "Success",
            },
          });
        }
      );
    }
  } catch (err) {
    console.error("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/get_data_dictionary", function (req, res) {
  let ssData;
  console.log("body", req.query);
  let readDir;
  if (req.query.archived) {
    readDir = __dirname + "/deleted/";
  } else {
    readDir = __dirname + "/uploads/";
  }
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
        let allowedColumns = [
          "Form Name",
          "Field Label",
          "Field Annotation",
          "OMOP concept_name",
          "Approved",
        ];
        data.forEach((row) => {
          let rowData = {};
          row.forEach((element, index) => {
            if (allowedColumns.includes(headers[index]))
              rowData[headers[index]] = element;
          });
          rows.push(rowData);
        });
        return rows;
      };

      const importExcel = (req) => {
        /* grab the first file */
        const workBook = XLSX.readFile(readDir + dataFile);

        //get first sheet
        const workSheetName = workBook.SheetNames[0];
        const workSheet = workBook.Sheets[workSheetName];
        //convert to array
        const fileData = XLSX.utils.sheet_to_json(workSheet, {
          header: 1,
          sheetStubs: true,
          defval: "",
        });
        const headers = fileData[0];
        if (!headers.includes("Approved")) headers.push("Approved");
        const heads = headers.map((head) => ({
          accessorKey: head.toString().replaceAll(".", ""),
          header: head.toString().replaceAll(".", ""),
        }));
        ssColDefs = heads;
        //removing header
        fileData.splice(0, 1);
        ssData = convertToJson(headers, fileData);
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
    console.error("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/save_data_dictionary", function (req, res) {
  const directoryPath = path.join(__dirname, "uploads");

  try {
    if (!req.body.data.fileName) {
      res.send({
        status: false,
        message: "No filename provided",
      });
    } else {
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let dataFile = req.body.data.fileName;

      //first check to see if filename already exists
      //passsing directoryPath and callback function
      fs.readdir(__dirname + "/uploads/", async (err, files) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error reading files");
        } else {
          const fileDetails = await getFileDetails(files);
          const exists = fileDetails.some(
            (item) => item["fileName"] === req.body.data.fileName
          );
          if (exists) {
            //overwrite and save file with new contents
            console.log("File exists now saving...");
            //convert json data to csv/xlsx
            let fileData = req.body.data.fileData;
            var worksheet = XLSX.utils.json_to_sheet(fileData);
            var workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Dates");
            console.log("Writing file...");
            /* create an XLSX file and try to save to Presidents.xlsx */
            XLSX.writeFile(
              workbook,
              __dirname + "/uploads/" + req.body.data.fileName,
              { compression: true }
            );
            // XLSX.writeFile(workbook, __dirname + "/uploads/" + 'file.xlsx', function(err) {
            //   if(err) console.log(err)
            //   else{
            //     console.log('File saved!')
            res.status(200).send({
              status: true,
              message: "File saved",
            });
            // }
            // });
          } else {
            // console.log("File does not exist. not saving.");
            res.status(500).send({
              status: false,
              message: "File does not exist",
            });
          }
        }
      });

      // const extensions = ["xlsx", "xls", "csv"];
      // const getExtension = (file) => {
      //   const parts = file.name.split(".");
      //   const extension = parts[parts.length - 1];
      //   return extensions.includes(extension); // return boolean
      // };

      // const convertToJson = (headers, data) => {
      //   const rows = [];
      //   data.forEach((row) => {
      //     let rowData = {};
      //     row.forEach((element, index) => {
      //       rowData[headers[index]] = element;
      //     });
      //     rows.push(rowData);
      //   });
      //   return rows;
      // };

      // const importExcel = (req) => {
      //   const file = dataFile.name;
      //   csvFileName = file.name;
      //   const workBook = XLSX.read(req.files.dataFile.data);

      //   //get first sheet
      //   const workSheetName = workBook.SheetNames[0];
      //   const workSheet = workBook.Sheets[workSheetName];
      //   //convert to array
      //   const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
      //   const headers = fileData[0];
      //   if (!headers.includes("Approved")) headers.push("Approved");
      //   const heads = headers.map((head) => ({
      //     accessorKey: head.toString().replaceAll(".", ""),
      //     header: head.toString().replaceAll(".", ""),
      //   }));
      //   ssColDefs = heads;
      //   //removing header
      //   fileData.splice(0, 1);
      //   ssData = convertToJson(headers, fileData);

      //   //Use the mv() method to place the file in the upload directory (i.e. "uploads")
      //   // Package and Release Data (`writeFile` tries to write and save an XLSB file)
      //   // XLSX.writeFile(ssData, "./uploads/" + "Report.csv");
      //   dataFile.mv("./uploads/" + dataFile.name, (err) => {
      //     if (err) throw err;
      //     else {
      //       //send response
      //       res.send({
      //         status: true,
      //         message: "File is uploaded",
      //         data: {
      //           name: dataFile.name,
      //           mimetype: dataFile.mimetype,
      //           size: dataFile.size,
      //         },
      //       });
      //     }
      //   });
      // };
    }
  } catch (err) {
    console.error("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
});

var server = app.listen(appPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.info("Port to use:", port);
  if (host === "::") host = "localhost";
  console.info("Backend Express Server listening at http://%s:%s", host, port);
});
