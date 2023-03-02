const userService = require("../services/userService");
var jwt = require("jsonwebtoken");

async function getUserByEmail(req, res) {
  const id = req.params.id;
  const user = await userService.getUserByEmail(id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: `User with ID ${id} not found` });
  }
}

async function createUser(req, res) {
  try {
    const userData = req.body;
    await userService.createUser(userData);
    let jwtToken = jwt.sign(
      { user: req.body.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
    let userInfo = {firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, role: 'default'} //set initial user as default user role
    res.status(200).send({jwtToken: jwtToken, userInfo: userInfo});
  } catch (error) {
    console.error(error);
    res.status(400).send("Error");
  }
}

async function signInUser(req, res) {
  try {
    const userData = req.body;
    let loginData = await userService.signInUser(userData);
    if (loginData) {
      res.status(200).send(loginData);
    } else res.status(403).send("Error");
  } catch (error) {
    console.error(error);
    res.status(400).send("Error");
  }
}

async function validateUser(req, res) {
  // console.log('validate user called...')
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // get token from Authorization header
  let verified = await userService.validateUser(token);
  if (verified) {
    res.status(200).send(JSON.stringify(verified));
  } else {
    res.status(403).send("Error");
  }
}

async function getUserJobs(req, res) {
  // const id = req.params.id;
  await userService.getUserJobs(req, res);
}

module.exports = {
  getUserByEmail,
  createUser,
  signInUser,
  validateUser,
  getUserJobs
};
