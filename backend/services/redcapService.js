const db = require("../db/mysqlConnection.cjs");
const crypto = require("crypto");
var axios = require("axios");
var FormData = require("form-data");
var cheerio = require("cheerio");

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
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
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
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
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
        res.status(200).send(JSON.stringify(metadata));
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Error");
      });
  });
}

module.exports = {
  getForms,
  exportMetadata,
};
