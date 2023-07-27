const db = require("../db/mysqlConnection.cjs");
const crypto = require("crypto");
var axios = require("axios");
var FormData = require("form-data");
var cheerio = require("cheerio");
const fs = require('fs');
const { mongoClient, connect } = require("../db/mongoDBConnection"); // Assuming 'db' is the name of the file you created

async function connectMongo() {
  await connect();
}

function decrypt(encryptedData, iv, algorithm, secretKey) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(Buffer.from(encryptedData, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function getForms(req, res) {
  if (process.env.NODE_ENV == "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  }
  const query = "SELECT * FROM api where name like 'redcap%'";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).json({ message: "Error" });
    }
    // console.log("results", results);

    const redcapKeyResult = results.find((api) => api.name === "redcapAPIKey");

    const redcapURLResult = results.find((api) => api.name === "redcapAPIURL");

    if (!redcapKeyResult || !redcapURLResult) {
      res.status(500).json({ message: "Error" });
      return;
    }

    let apiKey = redcapKeyResult.apiKey;
    let apiIV = redcapKeyResult.iv;
    let apiURL = redcapURLResult.endpoints;

    //decrypt api key
    let apiKeyDecrypted = decrypt(
      apiKey,
      apiIV,
      "aes-256-cbc",
      process.env.AES_32_BIT_KEY
    );
    // console.log("apiKeyDec", apiKeyDecrypted);

    var data = new FormData();
    data.append("token", apiKeyDecrypted);
    data.append("content", "metadata");
    data.append("format", "json");

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: apiURL,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        const metadata = response.data;
        const formNames = new Set();
        for (const field of metadata) {
          if (field["form_name"]) {
            formNames.add(field["form_name"]);
          }
        }
        // console.log(Array.from(formNames));
        res.status(200).send(JSON.stringify(Array.from(formNames)));
      })
      .catch(function (error) {
        // console.log(error);
        res.status(500).json({ message: "Error" });
      });
  });
}

async function exportMetadata(req, res) {
  if (!req.body.form) {
    res.status(500).send("Error");
    return;
  }
  if (process.env.NODE_ENV == "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  }
  // console.log("test redcap api");
  const query = "SELECT * FROM api where name like 'redcap%'";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    // console.log("results", results);

    const redcapKeyResult = results.find((api) => api.name === "redcapAPIKey");

    const redcapURLResult = results.find((api) => api.name === "redcapAPIURL");

    // console.log("redcapKeyResult", redcapKeyResult);
    if (!redcapKeyResult || !redcapURLResult) {
      res.status(500).send("Error");
      return;
    }

    let apiKey = redcapKeyResult.apiKey;
    let apiIV = redcapKeyResult.iv;
    let apiURL = redcapURLResult.endpoints;

    //decrypt api key
    let apiKeyDecrypted = decrypt(
      apiKey,
      apiIV,
      "aes-256-cbc",
      process.env.AES_32_BIT_KEY
    );
    // console.log("apiKeyDec", apiKeyDecrypted);
    // console.log('req', req.body)
    var data = new FormData();
    data.append("token", apiKeyDecrypted);
    data.append("content", "metadata");
    data.append("format", "json");
    data.append("forms[0]", req.body.form);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: apiURL,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        const metadata = response.data;
        // console.log('metadata', metadata)
        metadata.map((item) => {
          // console.log('item', item.field_label)
          item.field_label = cheerio.load(item.field_label).text();
        });

        console.log('metadata', metadata.slice(0,3))
        res.status(200).header('Content-Type', 'application/json').send(JSON.stringify(metadata));
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Error");
      });
  });
}

async function updateDD(req, res) {
  if (!req.body.form) {
    res.status(500).send("Error");
    return;
  }
  if (process.env.NODE_ENV == "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  }
  // console.log("test redcap api");
  const query = "SELECT * FROM api where name like 'redcap%'";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    // console.log("results", results);

    const redcapKeyResult = results.find((api) => api.name === "redcapAPIKey");

    const redcapURLResult = results.find((api) => api.name === "redcapAPIURL");

    // console.log("redcapKeyResult", redcapKeyResult);
    if (!redcapKeyResult || !redcapURLResult) {
      res.status(500).send("Error");
      return;
    }

    let apiKey = redcapKeyResult.apiKey;
    let apiIV = redcapKeyResult.iv;
    let apiURL = redcapURLResult.endpoints;

    //decrypt api key
    let apiKeyDecrypted = decrypt(
      apiKey,
      apiIV,
      "aes-256-cbc",
      process.env.AES_32_BIT_KEY
    );
    // console.log("apiKeyDec", apiKeyDecrypted);
    // console.log('req', req.body)
    var data = new FormData();
    data.append("token", apiKeyDecrypted);
    data.append("content", "metadata");
    data.append("format", "json");
    // data.append("forms[0]", req.body.form);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: apiURL,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        const metadata = response.data;
        // console.log('metadata', metadata)
        metadata.map((item) => {
          // console.log('item', item.field_label)
          item.field_label = cheerio.load(item.field_label).text();
        });

        console.log('metadata', metadata.slice(0,3))
        res.status(200).header('Content-Type', 'application/json').send(JSON.stringify(metadata));
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Error");
      });
  });
}





//the below functions should be moved out of the web app and into the desktop companion app 

// async function exportRecords(req, res) {
//   if (!req.body.formName || !req.body.jobID) {
//     res.status(500).send("Error");
//     return;
//   }

//   try {
//     // Connect to MongoDB
//     await mongoClient.connect();

//     // Get the database and the collection
//     const db = mongoClient.db("GPT3_Embeddings"); // replace with your database name
//     const collection = db.collection("jobVerifyInfo");
//     console.log("req.body", req.body);
//     console.log(req.body.jobID);
//     console.log(parseInt(req.body.jobID));
//     // Define the filter for identifying the document to find
//     const filter = {
//       jobId: parseInt(req.body.jobID),
//       formName: req.body.formName,
//     };
//     // Find the document based on the filter
//     const document = await collection.findOne(filter);
//     // console.log("doc", document);
//     // Check if the document was found
//     if (document) {
//       // Send the found document as a successful response
//       // console.log("doc", JSON.parse(document.jobData));

//       const verifiedElements = JSON.parse(document.jobData).filter((item) => {
//         // Return true for elements where 'verified' is false
//         return item.verified === true;
//       });
//       const selectedAndVerifiedResults = await findSelectedAndVerified(
//         verifiedElements
//       );
//       // console.log("selected elems", selectedAndVerifiedResults);
//       // setVerifiedElements(_verifiedElements.length)
//       // setData(selectedAndVerifiedResults);

//       getRedcapRecords(req, res, selectedAndVerifiedResults);

//       // res.status(200).json(document);
//     } else {
//       // Send a not found response
//       res.status(500).json({ message: "Document not found" });
//       await mongoClient.close();
//     }
//   } catch (error) {
//     console.error("Error connecting to MongoDB", error);
//     await mongoClient.close();
//     // Send an error response
//     res.status(500).send("Error");
//   }
// }

// function findSelectedAndVerified(arr) {
//   const result = [];

//   for (const obj of arr) {
//     // Check if the outer object has both selected and verified equal to true
//     if (obj.selected === true && obj.verified === true) {
//       // Remove the subRows property and add the object to the result array
//       const newObj = { ...obj };
//       delete newObj.subRows;
//       result.push(newObj);
//     }

//     // If the object has a subRows property and it is an array
//     if (Array.isArray(obj.subRows)) {
//       // Loop through the subRows array
//       for (const subRow of obj.subRows) {
//         // Check if selected and verified are true for the subRow
//         if (subRow.selected === true && subRow.verified === true) {
//           result.push(subRow);
//         }
//       }
//     }
//   }

//   return result;
// }

// function getRedcapRecords(req, res, selectedAndVerifiedResults) {
//   // console.log('body', req.body)
//   if (process.env.NODE_ENV == "local") {
//     process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
//   }
//   // console.log("test redcap api");
//   const query = "SELECT * FROM api where name like 'redcap%'";
//   //   return new Promise((resolve, reject) => {
//   db.execute(query, [], function (err, results, fields) {
//     if (err) {
//       console.log("error!", err);
//       res.status(500).send("Error");
//     }
//     // console.log("results", results);

//     const redcapKeyResult = results.find((api) => api.name === "redcapAPIKey");

//     const redcapURLResult = results.find((api) => api.name === "redcapAPIURL");

//     // console.log("redcapKeyResult", redcapKeyResult);
//     if (!redcapKeyResult || !redcapURLResult) {
//       res.status(500).send("Error");
//       return;
//     }

//     let apiKey = redcapKeyResult.apiKey;
//     let apiIV = redcapKeyResult.iv;
//     let apiURL = redcapURLResult.endpoints;

//     //decrypt api key
//     let apiKeyDecrypted = decrypt(
//       apiKey,
//       apiIV,
//       "aes-256-cbc",
//       process.env.AES_32_BIT_KEY
//     );
//     // console.log("apiKeyDec", apiKeyDecrypted);
//     // console.log('req', req.body)
//     var data = new FormData();
//     data.append("token", apiKeyDecrypted);
//     data.append("content", "record");
//     data.append("format", "json");
//     data.append("returnFormat", "json");
//     data.append("action", "export");
//     data.append("type", "flat");
//     data.append("rawOrLabel", "raw");
//     data.append("rawOrLabelHeaders", "raw");
//     if (req.body.form) data.append("forms[0]", req.body.formName);

//     var config = {
//       method: "post",
//       maxBodyLength: Infinity,
//       url: apiURL,
//       headers: {
//         ...data.getHeaders(),
//       },
//       data: data,
//     };

//     axios(config)
//       .then(function (response) {
//         const redcapRecords = response.data;
//         // console.log("redcapRecords", redcapRecords);

//         const combinedArray = [];

//         redcapRecords.forEach((obj1) => {
//           for (const key in obj1) {
//             // console.log('key', key)
//             if (obj1.hasOwnProperty(key)) {
//               const fieldValue = obj1[key];
//               // console.log('fieldval', fieldValue)
//               const matchingObject = selectedAndVerifiedResults.find(
//                 (obj2) => obj2.extraData.field_name === key
//               );

//               if (matchingObject) {
//                 combinedArray.push({
//                   key: key,
//                   value: fieldValue,
//                   matchingObject: matchingObject,
//                 });
//               }
//             }
//           }
//         });

//         console.log("combined", combinedArray);
//         const outputFilePath = "combinedArray.json";
//         const outputText = JSON.stringify(combinedArray, null, 2);

//         fs.writeFile(outputFilePath, outputText, (err) => {
//           if (err) {
//             console.error("Error writing to file:", err);
//           } else {
//             console.log("File saved successfully:", outputFilePath);
//           }
//         });
//         res.status(200).send("Ok");
//       })
//       .catch(function (error) {
//         console.log(error);
//         res.status(500).send("Error");
//       });
//   });
// }

module.exports = {
  getForms,
  exportMetadata,
  // exportRecords,
  updateDD
};
