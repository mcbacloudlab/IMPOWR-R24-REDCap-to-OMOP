const db = require("../db/mysqlConnection.cjs");
const Joi = require("joi");
const bcrypt = require("bcrypt");

async function getUserById(email) {
  const query = "SELECT * FROM users WHERE email = ?";
  return new Promise((resolve, reject) => {
    db.execute(query, [email], function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        reject("Error");
      }
      console.log("results", results);
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
    console.log("Req validated!");

    return getUserById(userData.email).then((user) => {
      console.log("user", user);
      if (user.length > 0) {
        throw new Error("Error! User already exists");
      }
      const saltRounds = 10;
      const myPlaintextPassword = userData.password;

      return bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(myPlaintextPassword, salt, function (err, hash) {
          // Store hash in your password DB.
          console.log("hash", hash);
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
                console.log(results); // results contains rows returned by server
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
  console.log("Req validated!");

  const user = await getUserById(validatedData.email);
  console.log("user", user);

  if (user.length == 0) {
    return "Error!"
    // throw new Error("Error! User does not exist!");

  }

  const result = await bcrypt.compare(userData.password, user[0].password);
  console.log("bcrypt result", result);

  return result ? "Ok!" : "Error!";
}

module.exports = {
  getUserById,
  createUser,
  signInUser,
};
