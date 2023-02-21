const userService = require('../services/userService');
var jwt = require('jsonwebtoken');

async function getUserById(req, res) {
  const id = req.params.id;
  const user = await userService.getUserById(id);
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
    console.log("success....");
    let jwtToken = jwt.sign({
    }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    res.status(200).send(jwtToken);
  } catch (error) {
    console.error(error);
    res.status(400).send("Error");
  }
}

async function signInUser(req, res) {
  try {
    const userData = req.body;
    let loginData = await userService.signInUser(userData);
    console.log('loginStat', loginData);
    if(loginData){
      res.status(200).send(loginData);
    }else res.status(403).send('Error')
  } catch (error) {
    console.error(error);
    res.status(400).send("Error");
  }
}

async function validateUser(req, res){
  console.log('validate user')
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // get token from Authorization header
  let verified = await userService.validateUser(token)
  console.log('verified?', verified)
  if(verified){
    res.status(200).send("Ok!");
  }else{
    res.status(403).send("Error");
  }
}


module.exports = {
  getUserById,
  createUser,
  signInUser,
  validateUser
};
