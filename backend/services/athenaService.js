var pg_pool = require("../db/postgresqlConnection.cjs");
const { decodeToken } = require("../utils/token");

async function getDataByConceptID(req, res) {
  let user = await decodeToken(req);
  if (!req.body.conceptID) {
    res.status(400).json({ message: "Bad request" });
    return;
  }
  let pg_response;
  const searchTerm = `%${req.body.conceptID.toLowerCase()}%`;

  if (parseInt(req.body.conceptID)) {
    pg_response = await pg_pool.query(
      "SELECT * FROM concept WHERE concept_id = $1",
      [parseInt(req.body.conceptID)]
    );
  } else {
    // pg_response = await pg_pool.query(
    //   "SELECT * FROM concept WHERE concept_name ILIKE $1",
    //   [searchTerm]
    // );
  }

  if (pg_response.rows.length > 0) {
    res
      .status(200)
      .json({ length: pg_response.rowCount, data: pg_response.rows });
  } else {
    console.log("no results from pg db");
    res.status(200).json({ message: "No results found" });
  }
}

async function getDetailDataByConceptID(req, res) {
  let user = await decodeToken(req);
  if (!req.body.conceptID) {
    res.status(400).json({ message: "Bad request" });
    return;
  }
  let pg_response;
  const searchTerm = `%${req.body.conceptID.toLowerCase()}%`;

  if (parseInt(req.body.conceptID)) {
    pg_response = await pg_pool.query(
      `SELECT * 
        FROM concept_relationship 
        LEFT OUTER JOIN concept on concept_id_2 = concept_id
        where concept_id_1 = $1`,
      [parseInt(req.body.conceptID)]
    );
  } else {
    //   pg_response = await pg_pool.query(
    //     "SELECT * FROM concept WHERE concept_name ILIKE $1",
    //     [searchTerm]
    //   );
  }

  if (pg_response.rows.length > 0) {
    res
      .status(200)
      .json({ length: pg_response.rowCount, data: pg_response.rows });
  } else {
    console.log("no results from pg db");
    res.status(200).json({ message: "No results found" });
  }
}

async function getDataByText(req, res) {

  let user = await decodeToken(req);
  if (!req.body.text) {
    res.status(400).json({ message: "Bad request" });
    return;
  }

  const searchTerm = `%${req.body.text.toLowerCase()}%`;

  let pg_response = await pg_pool.query(
    "SELECT * FROM concept WHERE concept_name ILIKE $1",
    [searchTerm]
  );

  if (pg_response.rows.length > 0) {
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
  getDetailDataByConceptID,
  getDataByText,
};
