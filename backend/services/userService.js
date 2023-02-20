const db = require('../db/mysqlConnection.cjs');

async function getAllUsers() {
  const query = 'SELECT * FROM users';
  const result = await db.query(query);
  return result.rows;
}

async function getUserById(id) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await db.query(query, [id]);
  return result.rows[0];
}
