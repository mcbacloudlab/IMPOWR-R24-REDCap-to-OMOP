const db = require("../db/mysqlConnection.cjs");
const crypto = require("crypto");
var axios = require("axios");
const { decodeToken } = require("../utils/token");

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

async function getUMLSSearchResults(req, res) {
  if (process.env.NODE_ENV == "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file
  }
  let user = await decodeToken(req);
  let userID = user.id;

  console.log("reqbody", req.body.searchText);
  if (!req.body.searchText) {
    res.status(500).send("Error");
  }
  let searchText = req.body.searchText;
  // URL-encode the searchText string
  const encodedSearchText = encodeURIComponent(searchText);

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
      url: `https://uts-ws.nlm.nih.gov/rest/search/current?string=${encodedSearchText}&sabs=SNOMEDCT_US&apiKey=${apiKeyDecrypted}&pageSize=50&returnIdType=code`,
      headers: {},
    };

    axios(config)
      .then(function (response) {
        const metadata = response.data.result.results;
        res.status(200).send(metadata);
      })
      .catch(function (error) {
        console.log("Error with UMLS API search", error);
        res.status(500).send("Error");
      });
  });
}

module.exports = {
  getUMLSSearchResults,
};
