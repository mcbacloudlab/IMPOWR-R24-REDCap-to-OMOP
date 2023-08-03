var jwt = require("jsonwebtoken");
const db = require("../db/mysqlConnection.cjs");

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

function decodeToken(req, res) {
    // console.log('req.headers', req.headers)
  let token = determineTokenHeaderOrCookie(req)
   console.log('token', token)
  if (!token) {
    return res.sendStatus(401); // Send 401 status if no token is provided
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {
        if (err) {
            reject(err);
        } else {
            console.log('the user!', user.user)
            let userResults = await getUserByEmail(user.user)
            console.log('userResults', userResults[0].id)
            user.id = userResults[0].id
            resolve(user);
        }
    });
});
}

function determineTokenHeaderOrCookie(req){
    // console.log('req', req.headers.authorization)
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
    return token;
}

module.exports = { getUserByEmail, decodeToken, determineTokenHeaderOrCookie };
