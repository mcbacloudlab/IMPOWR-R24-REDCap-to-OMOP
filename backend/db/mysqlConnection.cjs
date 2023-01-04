
// get the client
const mysql = require('mysql2');

console.log("Connecting to MySQL DB" + new Date().toLocaleString())
// create the mysql_pool to database
const mysql_pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DB,
  password: process.env.MYSQL_PASS
});
console.log('Connected to MySQL DB at ' + new Date().toLocaleString())

module.exports = mysql_pool