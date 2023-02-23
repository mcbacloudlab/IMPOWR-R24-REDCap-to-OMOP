const db = require("../db/mysqlConnection.cjs");
const Joi = require("joi");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

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

async function createUser(userData) {
  const userDataSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  function validateUserData(userData) {
    const { error, value } = userDataSchema.validate(userData);
    if (error) {
      console.error(error.details[0].message);
      return Promise.reject(`Validation error: ${error.details[0].message}`);
    }
    return Promise.resolve(value);
  }

  return validateUserData(userData).then((userData) => {
    return getUserById(userData.email).then((user) => {
      if (user.length > 0) {
        throw new Error("Error! User already exists");
      }
      const saltRounds = 10;
      const myPlaintextPassword = userData.password;

      return bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(myPlaintextPassword, salt, function (err, hash) {
          // Store hash in your password DB.
          return new Promise((resolve, reject) => {
            const query =
              "INSERT INTO users (firstName, lastName, email, password) VALUES(?,?,?,?)";

            db.execute(
              query,
              [userData.firstName, userData.lastName, userData.email, hash],
              function (err, results, fields) {
                if (err) {
                  console.log("error!", err);
                  reject("Error");
                }
                resolve(results);
              }
            );
          }).catch((error) => {
            console.log("DB Error: ", error);
            throw new Error("Sign up error");
          });
        });
      });
    });
  });
}

async function signInUser(userData) {
  const userDataSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  function validateUserData(userData) {
    const { error, value } = userDataSchema.validate(userData);
    if (error) {
      console.error(error.details[0].message);
      return Promise.reject(`Validation error: ${error.details[0].message}`);
    }
    return Promise.resolve(value);
  }

  const validatedData = await validateUserData(userData);

  const userInfo = await getUserById(validatedData.email);
  let userInfoToReturn = { firstName: userInfo[0].firstName, lastName: userInfo[0].lastName, email: userInfo[0].email, role: userInfo[0].role }

  if (userInfo.length == 0) {
    return "Error!";
    // throw new Error("Error! User does not exist!");
  }

  const result = await bcrypt.compare(userData.password, userInfo[0].password);
  if (result) {
    let jwtToken = jwt.sign({user: userInfo[0].email }, process.env.JWT_SECRET_KEY, {
      expiresIn: "72h",
    });

    return { jwtToken: jwtToken, userInfo: userInfoToReturn };
  } else {
    return null;
  }
}

async function validateUser(authData) {
  try {
    let jwtVerified = jwt.verify(authData, process.env.JWT_SECRET_KEY);
    //now get user info again
    let userInfo = await getUserById(jwtVerified.user);
    userInfo = userInfo[0]
    let userInfoToReturn = {firstName: userInfo.firstName, lastName: userInfo.lastName, email: userInfo.email, role: userInfo.role}
    return userInfoToReturn;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getUserById,
  createUser,
  signInUser,
  validateUser,
};
