const { Pool } = require("pg");

const credentials = {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASS,
    port: 5432,
  };
console.log("Connecting to PostgreSQL DB" + new Date().toLocaleString())
// Connect with a connection pool.
const pg_pool = new Pool(credentials);

console.log('Connected to PostgreSQL DB at ' + new Date().toLocaleString())

module.exports = pg_pool