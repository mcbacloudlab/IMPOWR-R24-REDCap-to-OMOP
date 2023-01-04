const { Pool } = require("pg");

const credentials = {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASS,
    port: 5432,
  };
console.log("Connecting to PostgreSQL DB" + new Date().toLocaleString())
// create the mysql_pool to database
// Connect with a connection pool.

// async function poolDemo() {
const pg_pool = new Pool(credentials);
    // const now = await pool.query("SELECT NOW()");
    // await pool.end();
  
    // return now;
  // }
console.log('Connected to PostgreSQL DB at ' + new Date().toLocaleString())

module.exports = pg_pool