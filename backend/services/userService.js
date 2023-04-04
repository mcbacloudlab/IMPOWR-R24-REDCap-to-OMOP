const db = require("../db/mysqlConnection.cjs");
const Joi = require("joi");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
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
    return getUserByEmail(userData.email).then((user) => {
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

  const userInfo = await getUserByEmail(validatedData.email);
  let userInfoToReturn = {
    firstName: userInfo[0].firstName,
    lastName: userInfo[0].lastName,
    email: userInfo[0].email,
    role: userInfo[0].role,
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
    let userInfo = await getUserByEmail(jwtVerified.user);
    userInfo = userInfo[0];
    let userInfoToReturn = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      role: userInfo.role,
    };
    return userInfoToReturn;
  } catch (error) {
    return false;
  }
}

async function updateJobStatus(jobId) {
  // console.log("updateJobStatus", jobId);
  const now = new Date();
  const datetimeString = now.toISOString().slice(0, 19).replace("T", " ");
  try {
    // console.log('find job for: ', jobId)
    const status = await myQueue.getJob(jobId).then((job) => {
      return job.getState();
    });
    // console.log('status!', status)
    if (status) {
      // Update job status in MySQL database
      const query = `UPDATE jobs SET jobStatus = '${status}', lastUpdated = '${datetimeString}' WHERE jobId = '${jobId}'`;
      db.query(query, (error, results, fields) => {
        if (error) {
          console.error(error);
        } else {
          // console.log(`Updated job ${jobId} status to ${status}`);
        }
      });
    }
  } catch (error) {
    console.log("error", error);
  }
}

async function getUserJobs(req, res) {
  // Define a boolean variable to track whether a response has been sent
  let responseSent = false;

  myQueue.client.on("error", (err) => {
    // Log the error
    console.error("Error connecting to Redis:", err);
    // Check if a response has already been sent
    if (!responseSent) {
      // Send the response
      res.status(500).json({ message: "Error. Redis server is down" });
      // Set the variable to indicate that a response has been sent
      responseSent = true;
      return;
    }
  });
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let email = jwtVerified.user;
    // console.log('get user jobs for', email)
    const query = `SELECT jobId, jobStatus, concat(firstName, ' ', lastName) as submittedBy, jobName, redcapFormName, collectionName, totalCollectionDocs
    FROM redcap.users 
    INNER JOIN jobs ON users.id = jobs.userId
    where email = ? 
    and (jobStatus != 'cancelled' OR jobStatus IS NULL)
    and jobName != 'lookupEmbeddings'
    ORDER BY (jobStatus = 'active') DESC, jobId DESC
    limit 100`;
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
          if(!responseSent) res.status(500).send("Error");
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

async function getAllUserJobs(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    let jwtVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let email = jwtVerified.user;
    console.log("get user jobs for", req.body.type);
    let query;
    if (req.body.type == "complete") {
      query = `SELECT jobId, jobStatus, concat(firstName, ' ', lastName) as submittedBy, jobName, email, redcapFormName, collectionName, totalCollectionDocs
      FROM redcap.users 
      INNER JOIN jobs ON users.id = jobs.userId
      where jobStatus = 'completed'
      order by lastUpdated desc`;
    } else if (req.body.type == "pending") {
      query = `SELECT jobId, jobStatus, concat(firstName, ' ', lastName) as submittedBy, jobName, email, redcapFormName, collectionName, totalCollectionDocs
      FROM redcap.users 
      INNER JOIN jobs ON users.id = jobs.userId
      where jobStatus = 'active' or jobStatus = 'waiting'
      order by lastUpdated desc`;
    } else if (req.body.type == "failed") {
      query = `SELECT jobId, jobStatus, concat(firstName, ' ', lastName) as submittedBy, jobName, email, redcapFormName, collectionName, totalCollectionDocs
      FROM redcap.users 
      INNER JOIN jobs ON users.id = jobs.userId
      where jobStatus = 'failed'
      order by lastUpdated desc`;
    }

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

module.exports = {
  getUserByEmail,
  createUser,
  signInUser,
  validateUser,
  getUserJobs,
  getAllUserJobs,
};
