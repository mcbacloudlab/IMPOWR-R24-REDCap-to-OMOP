const db = require("../db/mysqlConnection.cjs");
const crypto = require("crypto");
var axios = require("axios");
var FormData = require("form-data");
const { decodeToken, determineTokenHeaderOrCookie } = require("../utils/token");

async function queryAllKeys(req, res) {
  let user = await decodeToken(req);
  let userID = user.id;
  const query = "SELECT name, endpoints FROM api where userId = ?";

  db.execute(query, [userID], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
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

async function updateAPIKey(req, res) {
  console.log("store key", req.body);

  let user = await decodeToken(req);
  let userID = user.id;
  let name = req.body.name;
  let apiKey = req.body.apiKey;
  let endpoints = req.body.endpoints;
  let apiKeyEncrypted;

  if (!endpoints) {
    endpoints = null;

    const algorithm = "aes-256-cbc";
    const secretKey = process.env.AES_32_BIT_KEY;
    const iv = crypto.randomBytes(16);
    apiKeyEncrypted = encrypt(apiKey);

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
  }
  console.log("endpoints?", endpoints);
  //start db stuff
  let query;
  if (endpoints) {
    console.log("start the query!!");
    query =
      "INSERT INTO api (userID, name, endpoints) VALUES(?,?,?) ON DUPLICATE KEY UPDATE endpoints=VALUES(endpoints)";
    db.execute(
      query,
      [userID, name, endpoints],
      function (err, results, fields) {
        if (err) {
          console.log("error!", err);
          res.status(400).send("Error");
        }
        res.status(200).send("Ok");
      }
    );
  } else {
    console.log("name", name);
    console.log("userID", userID);
    query =
      "INSERT INTO api (userID, name, apiKey, iv) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE apiKey = VALUES(apiKey), iv=VALUES(iv)";
    db.execute(
      query,
      [userID, name, apiKeyEncrypted.encryptedData, apiKeyEncrypted.iv],
      function (err, results, fields) {
        if (err) {
          console.log("error!", err);
          res.status(400).send("Error");
        }
        res.status(200).send("Ok");
      }
    );
  }
}

async function testRedcapAPI(req, res) {
  if (process.env.NODE_ENV == "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  }

  let user = await decodeToken(req);
  let userID = user.id;
  const query = "SELECT * FROM api where name like 'redcap%' and userID = ?";
  db.execute(query, [userID], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
   

    const redcapKeyResult = results.find((api) => api.name === "redcapAPIKey");

    const redcapURLResult = results.find((api) => api.name === "redcapAPIURL");

    if (!redcapKeyResult || !redcapURLResult) {
      res.status(500).send("Error");
      return;
    }

    let apiKey = redcapKeyResult.apiKey;
    let apiIV = redcapKeyResult.iv;
    let apiURL = redcapURLResult.endpoints;

    if (!apiURL.endsWith("/")) {
      apiURL += "/";
    }

    //decrypt api key
    let apiKeyDecrypted = decrypt(
      apiKey,
      apiIV,
      "aes-256-cbc",
      process.env.AES_32_BIT_KEY
    );

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
        res.status(200).send(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log('Test REDCap Error', error)
        res.status(500).send("Error");
      });
  });
}

async function testUMLSAPI(req, res) {
  if (process.env.NODE_ENV == "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  }
  let user = await decodeToken(req);
  let userID = user.id;
  const query = "SELECT * FROM api where name like 'umls%' and userID = ?";
 
  db.execute(query, [userID], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
  
    const umlsKeyResult = results.find((api) => api.name === "umlsAPIKey");


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

    var config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://uts-ws.nlm.nih.gov/rest/content/current/CUI/C4283958/atoms?ttys=PT&apiKey=${apiKeyDecrypted}`,
      headers: {},
    };

    axios(config)
      .then(function (response) {
        res.status(response.status).send();
      })
      .catch(function (error) {
        console.log(error);
        res.status(error.request.res.statusCode).send();
      });
  });
}

async function testGPT3API(req, res) {
  if (process.env.NODE_ENV == "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  }
  let user = await decodeToken(req);
  let userID = user.id;
  const query = "SELECT * FROM api where name like 'gpt3%' and userID = ?";

  db.execute(query, [userID], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }

    const gpt3KeyResult = results.find((api) => api.name === "gpt3APIKey");

    if (!gpt3KeyResult) {
      res.status(500).send("Error");
      return;
    }

    let apiKey = gpt3KeyResult.apiKey;
    let apiIV = gpt3KeyResult.iv;

    //decrypt api key
    let apiKeyDecrypted = decrypt(
      apiKey,
      apiIV,
      "aes-256-cbc",
      process.env.AES_32_BIT_KEY
    );

    var data = JSON.stringify({
      input: "test",
      model: "text-embedding-ada-002",
    });

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.openai.com/v1/embeddings",
      headers: {
        Authorization: "Bearer " + apiKeyDecrypted,
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        res.status(response.status).send();
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Error");
      });
  });
}

module.exports = {
  queryAllKeys,
  updateAPIKey,
  testRedcapAPI,
  testUMLSAPI,
  testGPT3API,
};
