const db = require("../db/mysqlConnection.cjs");
async function queryAllKeys(req, res) {
    console.log('query all keys', req.body)
    const query = "SELECT name, RIGHT(apikey, 4) AS apikey FROM api";
    //   return new Promise((resolve, reject) => {
    db.execute(query, [], function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        res.status(500).send('Error')
      }
      console.log('results', results)
      res.status(200).send(results)
    });
}

module.exports = {
    queryAllKeys
}