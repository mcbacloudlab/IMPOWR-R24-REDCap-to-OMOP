const userService = require('../services/userService');

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
    res.status(200).send("Ok!");
  } catch (error) {
    console.error(error);
    res.status(400).send("Error");
  }
}

async function signInUser(req, res) {
  try {
    const userData = req.body;
    let loginStatus = await userService.signInUser(userData);
    console.log('loginStat', loginStatus);
    if(loginStatus == 'Ok!')res.status(200).send("Ok!");
    else res.status(403).send('Error')
  } catch (error) {
    console.error(error);
    res.status(400).send("Error");
  }
}

async function validateUser(req, res){
  const userData = req.body;
  await userService.validateUser(userData)
}


module.exports = {
  getUserById,
  createUser,
  signInUser,
  validateUser
};
