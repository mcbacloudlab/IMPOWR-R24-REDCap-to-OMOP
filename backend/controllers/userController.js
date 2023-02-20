const userService = require('../services/userService');

async function getAllUsers(req, res) {
  const users = await userService.getAllUsers();
  res.json(users);
}

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
  const userData = req.body;
  const newUser = await userService.createUser(userData);
  res.json(newUser);
}

async function updateUser(req, res) {
  const id = req.params.id;
  const userData = req.body;
  const updatedUser = await userService.updateUser(id, userData);
  if (updatedUser) {
    res.json(updatedUser);
  } else {
    res.status(404).json({ error: `User with ID ${id} not found` });
  }
}

async function deleteUser(req, res) {
  const id = req.params.id;
  const deletedUser = await userService.deleteUser(id);
  if (deletedUser) {
    res.json(deletedUser);
  } else {
    res.status(404).json({ error: `User with ID ${id} not found` });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
