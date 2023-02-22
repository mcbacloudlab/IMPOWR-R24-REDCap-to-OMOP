const db = require("../db/mysqlConnection.cjs");
async function queryAllKeys(req, res) {
  console.log("query all keys", req.body);
  const query = "SELECT name, RIGHT(apikey, 4) AS apikey FROM api";
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

async function updateRedcapKey(req, res) {
  console.log("store key", req.body);
  let name = req.body.name;
  let apiKey = req.body.apiKey;

  const crypto = require("crypto");

  const algorithm = "aes-256-cbc";
  // console.log("process.env.AES_32_BIT_KEY", process.env.AES_32_BIT_KEY);
  const secretKey = process.env.AES_32_BIT_KEY;
  // console.log("Key length:", Buffer.byteLength(secretKey, 'utf8'));
  const iv = crypto.randomBytes(16);
  let apiKeyEncrypted = encrypt(apiKey);
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

  // function decrypt(encryptedData, iv) {
  //   const decipher = crypto.createDecipheriv(
  //     algorithm,
  //     secretKey,
  //     Buffer.from(iv, "hex")
  //   );
  //   let decrypted = decipher.update(Buffer.from(encryptedData, "hex"));
  //   decrypted = Buffer.concat([decrypted, decipher.final()]);
  //   return decrypted.toString();
  // }

  // // Decrypt the apiKey value
  // const apiKeyDecrypted = decrypt(apiKeyEncrypted.encryptedData, apiKeyEncrypted.iv);
  // console.log("apiKeyDecrypted:", apiKeyDecrypted);

  const query =
    "INSERT INTO api (name, apiKey, iv) VALUES(?,?,?) ON DUPLICATE KEY UPDATE apiKey = VALUES(apiKey), iv=VALUES(iv)";

  db.execute(query, [name, apiKeyEncrypted.encryptedData, apiKeyEncrypted.iv], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(400).send("Error");
    }
    console.log("result", results);
    res.status(200).send("Ok");
  });
}

module.exports = {
  queryAllKeys,
  updateRedcapKey,
};
