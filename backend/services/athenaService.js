var pg_pool = require("../db/postgresqlConnection.cjs");
const db = require("../db/mysqlConnection.cjs");
var axios = require("axios");
var FormData = require("form-data");
const { decodeToken } = require("../utils/token");

async function getDataByConceptID(req, res) {
//   console.log("get athena data");
//   console.log("the req", req.body);

  let user = await decodeToken(req);
//   console.log("the user", user);
if(!req.body.conceptID){
    res.status(400).json({ message: "Bad request" });
    return;
}
  const pg_response = await pg_pool.query(
    "SELECT * FROM concept WHERE concept_id = $1",
    [req.body.conceptID]
  );
  if (pg_response.rows.length > 0) {
    // console.log("the res", pg_response);
    res
      .status(200)
      .json({ length: pg_response.rowCount, data: pg_response.rows });
  } else {
    console.log("no results from pg db");
    res.status(200).json({ message: "No results found" });
  }
}

module.exports = {
  getDataByConceptID,
};
