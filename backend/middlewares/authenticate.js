var jwt = require("jsonwebtoken");
const db = require("../db/mysqlConnection.cjs");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if(!token){
    res.status(403).send('Error')
    return;
  }
  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let userInfo = await getUserById(jwtVerified.user);
    if (userInfo.length <= 0) {
      res.status(403).send("Error");
      return;
    }
    return next();
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Error");
    return false;
  }
}

async function getUserById(email) {
  const query = "SELECT * FROM users WHERE email = ?";
  return new Promise((resolve, reject) => {
    db.execute(query, [email], function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        reject("Error");
      }
      resolve(results);
    });
  });
}

async function requireAdmin(req, res, next) {
  console.log("require admin");
  console.log("req", req.body);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("jwtVerified", jwtVerified);
    let email = jwtVerified.user;
    const query = "SELECT role FROM users WHERE email = ?";
    //   return new Promise((resolve, reject) => {
    db.execute(query, [email], function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        res.status(500).send("Error");
      }
      console.log("results", results);
      if (results[0].role === "admin") {
        console.log("next", next);
        console.log("go next");
        return next();
      } else res.status(403).send("Error");
    });
    //   });
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Error");
    return false;
  }
}

module.exports = { authenticate, getUserById, requireAdmin };
