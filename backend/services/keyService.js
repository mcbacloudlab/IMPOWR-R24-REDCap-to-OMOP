const db = require("../db/mysqlConnection.cjs");
const crypto = require("crypto");
var axios = require("axios");
var FormData = require("form-data");
async function queryAllKeys(req, res) {
  console.log("query all keys", req.body);
  const query = "SELECT name, endpoints FROM api";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    console.log("results", results);
    res.status(200).send(results);
  });
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

async function updateRedcapKey(req, res) {
  console.log("store key", req.body);
  let name = req.body.name;
  let apiKey = req.body.apiKey;
  let endpoints = req.body.endpoints;
  let apiKeyEncrypted;

  if (!endpoints) {
    endpoints = null;

    const algorithm = "aes-256-cbc";
    // console.log("process.env.AES_32_BIT_KEY", process.env.AES_32_BIT_KEY);
    const secretKey = process.env.AES_32_BIT_KEY;
    // console.log("Key length:", Buffer.byteLength(secretKey, 'utf8'));
    const iv = crypto.randomBytes(16);
    apiKeyEncrypted = encrypt(apiKey);
    console.log("apiEncr", apiKeyEncrypted);

    function encrypt(text) {
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return {
        iv: iv.toString("hex"),
        encryptedData: encrypted.toString("hex"),
      };
    }

    // Decrypt the apiKey value
    const apiKeyDecrypted = decrypt(
      apiKeyEncrypted.encryptedData,
      apiKeyEncrypted.iv,
      algorithm,
      secretKey
    );
    console.log("apiKeyDecrypted:", apiKeyDecrypted);
  }

  //start db stuff
  let query;
  if (endpoints) {
    console.log("enDPOINTS!!!");
    query =
      "INSERT INTO api (name, endpoints) VALUES(?,?) ON DUPLICATE KEY UPDATE endpoints=VALUES(endpoints)";
    db.execute(query, [name, endpoints], function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        res.status(400).send("Error");
      }
      console.log("result", results);
      res.status(200).send("Ok");
    });
  } else {
    console.log("name", name);
    query =
      "INSERT INTO api (name, apiKey, iv) VALUES(?,?,?) ON DUPLICATE KEY UPDATE apiKey = VALUES(apiKey), iv=VALUES(iv)";
    db.execute(
      query,
      [name, apiKeyEncrypted.encryptedData, apiKeyEncrypted.iv],
      function (err, results, fields) {
        if (err) {
          console.log("error!", err);
          res.status(400).send("Error");
        }
        console.log("result", results);
        res.status(200).send("Ok");
      }
    );
  }
}

async function testRedcapAPI(req, res) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  console.log("test redcap api");
  const query = "SELECT * FROM api where name like 'redcap%'";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    console.log("results", results);

    const redcapKeyResult = results.find((api) => api.name === "redcapAPIKey");

    const redcapURLResult = results.find((api) => api.name === "redcapAPIURL");

    console.log("redcapKeyResult", redcapKeyResult);
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
    console.log("apiKeyDec", apiKeyDecrypted);

    var data = new FormData();
    data.append("token", apiKeyDecrypted);
    data.append("content", "version");
    data.append("format", "json");
    data.append("returnFormat", "json");

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
        console.log(JSON.stringify(response.data));
        res.status(200).send(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Error");
      });
  });
}

async function testUMLSAPI(req, res) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  console.log("test redcap api");
  const query = "SELECT * FROM api where name like 'umls%'";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    console.log("results", results);

    const umlsKeyResult = results.find((api) => api.name === "umlsAPIKey");

    console.log("umlsKeyResult", umlsKeyResult);
    if (!umlsKeyResult) {
      res.status(500).send("Error");
      return;
    }

    let apiKey = umlsKeyResult.apiKey;
    let apiIV = umlsKeyResult.iv;

    //decrypt api key
    let apiKeyDecrypted = decrypt(
      apiKey,
      apiIV,
      "aes-256-cbc",
      process.env.AES_32_BIT_KEY
    );
    console.log("apiKeyDec", apiKeyDecrypted);

    var config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://uts-ws.nlm.nih.gov/rest/content/current/CUI/C4283958/atoms?ttys=PT&apiKey=${apiKeyDecrypted}`,
      headers: {},
    };

    axios(config)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        // console.log('response stat' ,response.status)
        res.status(response.status).send();
      })
      .catch(function (error) {
        console.log(error);
        res.status(error.request.res.statusCode).send()
      });
  });
}

module.exports = {
  queryAllKeys,
  updateRedcapKey,
  testRedcapAPI,
  testUMLSAPI,
};
