var jwt = require("jsonwebtoken");
const db = require("../db/mysqlConnection.cjs");

async function authenticate(req, res, next) {
  //authenticate
  const authHeader = req.headers.authorization;
  const tokenFromHeader =
    authHeader &&
    authHeader.split(" ")[1] !== "undefined" &&
    authHeader.split(" ")[1] !== "null"
      ? authHeader.split(" ")[1]
      : null;

  // Get token from httpOnly cookie, if it exists
  const tokenFromCookie = req.cookies.token;
  // Use the token from the header if it exists; otherwise, use the token from the cookie
  token = tokenFromHeader || tokenFromCookie;
  if (!token) {
    res.status(403).send("Error");
    return;
  }
  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let userInfo
    if(jwtVerified.user == 'orcidUser'){
      userInfo = 'orcidUser'
    }else{
      userInfo = await getUserByEmail(jwtVerified.user);
    }

    if (userInfo.length <= 0) {
      res.status(403).send("Error");
      return;
    }
    return next();
  } catch (error) {
    console.log("error", error);
    res.status(403).send("Error");
    return false;
  }
}

async function getUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = ? and approved = 'Y'";
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
  const authHeader = req.headers.authorization;
  const tokenFromHeader =
    authHeader &&
    authHeader.split(" ")[1] !== "undefined" &&
    authHeader.split(" ")[1] !== "null"
      ? authHeader.split(" ")[1]
      : null;

  // Get token from httpOnly cookie, if it exists
  const tokenFromCookie = req.cookies.token;
  // Use the token from the header if it exists; otherwise, use the token from the cookie
  let token = tokenFromHeader || tokenFromCookie;
  

  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let email = jwtVerified.user;
    const query = "SELECT role FROM users WHERE email = ?";
    //   return new Promise((resolve, reject) => {
    db.execute(query, [email], function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        res.status(500).send("Error");
      }
      if (results[0].role === "admin") {
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



module.exports = { authenticate, getUserByEmail, requireAdmin };
