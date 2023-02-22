const db = require("../db/mysqlConnection.cjs");
var fs = require("fs").promises;
const path = require("path");
const XLSX = require("xlsx");

async function getFileDetails(files, readDir) {
  if (!readDir) readDir = path.join(__dirname, "..", "/uploads/");
  const filePromises = files.map((file) => {
    return new Promise(async (resolve, reject) => {
      try {
        const filePath = path.join(readDir, file);
        const stats = await fs.stat(filePath);
        let date = new Date(stats.mtime);
        date = date.toLocaleString("en-US");
        resolve({
          fileName: file,
          lastModified: date,
        });
      } catch (error) {
        console.error(`Error getting file stats for ${file}:`, error);
        reject(`Error getting file stats for ${file}: ${error.message}`);
      }
    });
  });

  try {
    const fileDetails = await Promise.all(filePromises);
    return fileDetails;
  } catch (error) {
    throw new Error(`Error getting file details: ${error.message}`);
  }
}

async function getDDList(req, res) {
  let readDir;
  if (req.query.archived) {
    readDir = path.join(__dirname, "..", "/deleted/");
  } else {
    readDir = path.join(__dirname, "..", "/uploads/");
  }

  try {
    const files = await fs.readdir(readDir);
    const fileDetails = await getFileDetails(files, readDir);
    fileDetails.sort(
      (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
    );
    return fileDetails;
  } catch (error) {
    console.error(error);
    return "Error";
  }
}

async function getDD(req, res) {
  let ssData;
  let readDir;
  if (req.query.archived) {
    readDir = path.join(__dirname, "..", "/deleted/");
  } else {
    readDir = path.join(__dirname, "..", "/uploads/");
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

      const convertToJson = (headers, data) => {
        const rows = [];
        let allowedColumns = [
          "Form Name",
          "Field Label",
          "Field Annotation",
          "OMOP concept_name",
          "REDCap Question",
          "SNOMED Text",
          "SNOMED ID",
          "Cosine Similarity",
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
    return "Error";
    //   res.status(500).send("Something went wrong");
  }
}

async function getExtension(file) {
  const extensions = ["xlsx", "xls", "csv"];
  let parts;
  if (typeof file === "string") parts = file.split(".");
  else parts = file.name.split(".");
  const extension = parts[parts.length - 1];
  return extensions.includes(extension); // return boolean
}

async function addDD(req, res) {
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
      const files = await fs.readdir(path.join(__dirname, "..", "/uploads/"));
      const fileDetails = await getFileDetails(files);

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
          }
        });
      };

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
      // });
    }
  } catch (err) {
    console.error("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
}

async function removeDD(req, res) {
  try {
    if (!req.body.file) {
      res.send({
        status: false,
        message: "No file",
      });
    } else {
      await fs.rename(
        path.join(__dirname, "..", "/uploads/") + req.body.file,
        path.join(__dirname, "..", "/deleted/") +
          new Date().toJSON().slice(0, 23).replaceAll(":", "_") +
          "_" +
          req.body.file
      );
      res.send({
        data: {
          message: "Success",
        },
      });
    }
  } catch (err) {
    console.error("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
}

async function saveDD(req, res) {
  try {
    if (!req.body.data.fileName) {
      res.send({
        status: false,
        message: "No filename provided",
      });
    } else {
      //first check to see if filename already exists
      let files = await fs.readdir(path.join(__dirname, "..", "/uploads/"));
      const fileDetails = await getFileDetails(files);
      const exists = fileDetails.some(
        (item) => item["fileName"] === req.body.data.fileName
      );
      if (exists) {
        //overwrite and save file with new contents
        //convert json data to csv/xlsx
        let fileData = req.body.data.fileData;
        var worksheet = XLSX.utils.json_to_sheet(fileData);
        var workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dates");

        XLSX.writeFile(
          workbook,
          path.join(__dirname, "..", "/uploads/") + req.body.data.fileName,
          { compression: true }
        );

        res.status(200).send({
          status: true,
          message: "File saved",
        });
      } else {
        res.status(500).send({
          status: false,
          message: "File does not exist",
        });
      }
    }
  } catch (err) {
    console.error("ERROR!", err);
    res.status(500).send("Something went wrong");
  }
}

module.exports = {
  getDDList,
  getDD,
  addDD,
  removeDD,
  saveDD,
};
