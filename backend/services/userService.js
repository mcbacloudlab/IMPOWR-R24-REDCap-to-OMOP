const db = require("../db/mysqlConnection.cjs");
const Joi = require("joi");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const util = require("util");
const Bull = require("bull");
const myQueue = new Bull("process-queue", {
  redis: {
    host: "localhost",
    port: 6379,
  },
});

async function getUserByEmail(email) {
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

async function createUser(userData, orcidUser) {
  // console.log("create userData", userData);

  const passwordSchema = Joi.string()
    .pattern(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must contain at least 1 number and 1 special character",
      "string.min": "Password should have a minimum length of {#limit}",
    });

  const userDataSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
    // email: Joi.string().email().required(),
    password: passwordSchema,
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
    return getUserByEmail(userData.email).then(async (user) => {
      if (user.length > 0) {
        // User already exists just returning
        return;
        // throw new Error("Error! User already exists");
      }
      const saltRounds = 10;
      const myPlaintextPassword = userData.password;
      // console.log("userData", userData);

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

const userDataSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("(?=.*[a-z])")) // At least one lowercase letter
    .pattern(new RegExp("(?=.*[A-Z])")) // At least one uppercase letter
    .pattern(new RegExp("(?=.*[!@#$%^&*])")) // At least one symbol
    .required(),
});

function validateUserData(userData) {
  const { error, value } = userDataSchema.validate(userData);
  if (error) {
    console.error(error.details[0].message);
    return Promise.reject(`Validation error: ${error.details[0].message}`);
  }
  return Promise.resolve(value);
}

async function signInUser(userData) {
  const validatedData = await validateUserData(userData);

  const userInfo = await getUserByEmail(validatedData.email);
  let userInfoToReturn = {
    firstName: userInfo[0].firstName,
    lastName: userInfo[0].lastName,
    email: userInfo[0].email,
    role: userInfo[0].role,
    approved: userInfo[0].approved,
  };

  if (userInfo.length == 0) {
    return "Error!";
    // throw new Error("Error! User does not exist!");
  }

  const result = await bcrypt.compare(userData.password, userInfo[0].password);
  if (result) {
    let jwtToken = jwt.sign(
      { user: userInfo[0].email },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "72h",
      }
    );

    return { jwtToken: jwtToken, userInfo: userInfoToReturn };
  } else {
    return null;
  }
}

async function validateUser(authData) {
  try {
    let jwtVerified = jwt.verify(authData, process.env.JWT_SECRET_KEY);
    //now get user info again
    // console.log("jwtverified", jwtVerified);
    let userInfoToReturn;
    let userInfo = [];

    userInfo = await getUserByEmail(jwtVerified.user);

    userInfo = userInfo[0];
    userInfoToReturn = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      role: userInfo.role,
      orcidId: jwtVerified.orcidId ? true : false,
      approved: userInfo.approved,
    };
    return userInfoToReturn;
  } catch (error) {
    // console.log("error!", error);
    return false;
  }
}

async function updateJobStatus(jobId) {
  //this is not an route/endpoint, just a helper function
  const now = new Date();
  const datetimeString = now.toISOString().slice(0, 19).replace("T", " ");
  try {
    const status = await myQueue.getJob(jobId).then((job) => {
      return job.getState();
    });
    if (status) {
      // Update job status in MySQL database
      const query = `UPDATE jobs SET jobStatus = ?, lastUpdated = ? WHERE jobId = ?`;
      db.query(
        query,
        [status, datetimeString, jobId],
        (error, results, fields) => {
          if (error) {
            console.error(error);
          } else {
            // console.log(`Updated job ${jobId} status to ${status}`);
          }
        }
      );
    }
  } catch (error) {
    console.log("error", error);
  }
}

async function getUserJobs(req, res) {
  // Define a boolean variable to track whether a response has been sent
  let responseSent = false;

  try {
    // Define a timeout duration (in milliseconds)
    const timeoutDuration = 3000; // 3 seconds
    // Use the Redis PING command to check the connection status
    // Use Promise.race to implement a timeout mechanism
    await Promise.race([
      myQueue.client.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), timeoutDuration)
      ),
    ]);

    // ... rest of the getUserJobs function ...
  } catch (error) {
    // If a timeout occurs or an error occurs while pinging Redis, respond with a 500 error message
    if (
      error.message === "Connection is closed." ||
      error.message === "Redis timeout"
    ) {
      console.error("Error connecting to Redis:", error);
      res.status(500).json({ message: "Error. Redis server is down" });
      return;
    }

    // Handle other errors
    console.log("getUserJobs error", error);
    res.status(500).send("Error");
    return false;
  }

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

  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let email = jwtVerified.user;
    // console.log("get user jobs for", jwtVerified);
    if (!jwtVerified.orcidId) {
      jwtVerified.orcidId = null;
    }

    const query = `SELECT jobId, jobStatus, concat(firstName, ' ', lastName) as submittedBy, jobName, redcapFormName, collectionName, totalCollectionDocs
    FROM redcap.users 
    LEFT JOIN jobs ON users.id = jobs.userId or users.email = jobs.userId
    WHERE ((email = ?) OR (email = ?))
    and (jobStatus != 'cancelled' OR jobStatus IS NULL)
    and jobName != 'lookupEmbeddings'
    ORDER BY (jobStatus = 'active') DESC, jobId DESC
    limit 100`;
    //   return new Promise((resolve, reject) => {
    db.execute(
      query,
      [email, jwtVerified.orcidId],
      async function (err, results, fields) {
        if (err) {
          console.log("error!", err);
          res.status(500).send("Error");
        }
        // console.log("results", results);
        //get status for unknown statuses for jobs....
        for (const job of results) {
          try {
            const foundJob = await myQueue.getJob(job.jobId);
            if (!foundJob) {
              // console.log("no found job for:" + job.jobId);
              //clean up unfound jobs - likely deleted from redis
              db.execute(
                `DELETE FROM jobs WHERE jobId = ?`,
                [job.jobId],
                async function (err, results, fields) {
                  if (err) {
                    console.log("error!", err);
                    res.status(500).send("Error");
                  } else {
                    console.log("cleaned up job from db:" + job.jobId);
                  }
                }
              );
              continue;
            } else {
              const status = await foundJob.getState();
              const timeAdded = foundJob.timestamp;
              const startedAt = foundJob.processedOn;
              const finishedAt = foundJob.finishedOn;
              const progress = await foundJob.progress();
              const dataLength = foundJob.data.dataLength;
              job.timeAdded = timeAdded;
              job.startedAt = startedAt;
              job.finishedAt = finishedAt;
              job.progress = progress;
              job.dataLength = dataLength;
              job.collections = foundJob.data.collections;
            }
          } catch (error) {
            console.log("error", error);
            if (!responseSent) res.status(500).send("Error");
          }
          // console.log('jobstat', job.jobStatus)
          if (job.jobStatus != "completed") {
            // console.log('updating')
            await updateJobStatus(job.jobId);
          }
        }

        // console.log("send status results", results);
        res.status(200).send(results);
      }
    );
    //   });
  } catch (error) {
    console.log("getUserJobs error", error);
    res.status(500).send("Error");
    return false;
  }
}

async function getAllUserJobs(req, res) {
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
  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let email = jwtVerified.user;
    // console.log("get user jobs for", req.body.type);
    let query = `SELECT jobId, jobStatus, concat(firstName, ' ', lastName) as submittedBy, jobName, email, redcapFormName, collectionName, totalCollectionDocs
    FROM redcap.users 
    LEFT JOIN jobs ON users.id = jobs.userId or users.email = jobs.userId
    WHERE jobName not like 'lookup%'
    ORDER BY (jobStatus = 'active') DESC, jobId DESC`;

    //   return new Promise((resolve, reject) => {
    db.execute(query, [email], async function (err, results, fields) {
      if (err) {
        console.log("error!", err);
        res.status(500).send("Error");
      }
      // console.log("results", results);
      //get status for unknown statuses for jobs....

      for (const job of results) {
        try {
          const foundJob = await myQueue.getJob(job.jobId);
          if (!foundJob) {
            console.log("no found job for:" + job.jobId);
            //clean up unfound jobs - likely deleted from redis
            // db.execute(`DELETE FROM jobs WHERE jobId = ?`, [job.jobId], async function (err, results, fields) {
            //   if (err) {
            //     console.log("error!", err);
            //     res.status(500).send("Error");
            //   }else{
            //     console.log('cleaned up job from db:' + job.jobId)
            //   }
            // })
            continue;
          } else {
            // console.log(job)

            const status = await foundJob.getState();
            const timeAdded = foundJob.timestamp;
            const startedAt = foundJob.processedOn;
            const finishedAt = foundJob.finishedOn;
            const progress = await foundJob.progress();
            const dataLength = foundJob.data.dataLength;
            // console.log("status", status);
            // console.log("timeadded", timeAdded);
            job.timeAdded = timeAdded;
            job.startedAt = startedAt;
            job.finishedAt = finishedAt;
            job.progress = progress;
            job.dataLength = dataLength;
          }
        } catch (error) {
          console.log("error", error);
          res.status(500).send("Error");
        }
        // console.log('jobstat', job.jobStatus)
        if (job.jobStatus != "completed") {
          // console.log('updating')
          await updateJobStatus(job.jobId);
        }
      }

      // console.log("send status results", results);
      res.status(200).send(results);
    });
    //   });
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Error");
    return false;
  }
}

async function changeUserPassword(req, res) {
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
  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let email = jwtVerified.user;
    let currentPassword = req.body.currentPassword;
    let newPassword = req.body.newPassword;
    let currentUserData = {
      password: req.body.currentPassword,
      email: email,
    };
    let newUserData = {
      password: req.body.newPassword,
      email: email,
    };

    const currentUserValidatedData = await validateUserData(currentUserData);
    const newUserValidatedData = await validateUserData(newUserData);

    const userInfo = await getUserByEmail(currentUserValidatedData.email);
    if (userInfo.length == 0) {
      return "Error!";
      // throw new Error("Error! User does not exist!");
    }

    const result = await bcrypt.compare(currentPassword, userInfo[0].password);

    if (result) {
      //password matches and jwt valid so now we update in db
      const saltRounds = 10;
      return bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(newPassword, salt, function (err, hash) {
          return new Promise((resolve, reject) => {
            const query = "UPDATE users SET password = ? WHERE email = ?";
            db.execute(query, [hash, email], function (err, results, fields) {
              if (err) {
                console.log("error!", err);
                reject("Error");
              }
              // console.log('results', results)
              res.status(200).send("Success");
            });
          }).catch((error) => {
            console.log("DB Error: ", error);
            throw new Error("DB error");
          });
        });
      });
    } else {
      console.log("Error password mismatch");
      res.status(500).send("Error");
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Error");
    return false;
  }
}

module.exports = {
  getUserByEmail,
  createUser,
  signInUser,
  validateUser,
  getUserJobs,
  getAllUserJobs,
  changeUserPassword,
};
