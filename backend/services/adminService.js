const db = require("../db/mysqlConnection.cjs");

async function queryAllUsers(req, res) {
  const query = "SELECT firstName, lastName, email, role, approved FROM users";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    res.status(200).send(results);
  });
}


async function removeUser(req, res) {
  if(!req.body.email){
    res.status(500).send("Error");
    return;
  }
  const query = "DELETE from users where email = ?";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [req.body.email], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    res.status(200).send(results);
  });
}

async function approveUser(req, res) {
  if(!req.body.email){
    res.status(500).send("Error");
    return;
  }
  const query = "UPDATE users set approved = 'Y' where email = ?";
  //   return new Promise((resolve, reject) => {
  db.execute(query, [req.body.email], function (err, results, fields) {
    if (err) {
      console.log("error!", err);
      res.status(500).send("Error");
    }
    res.status(200).send(results);
  });
}
module.exports = {
  queryAllUsers,
  removeUser,
  approveUser
};
