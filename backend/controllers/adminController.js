const adminService = require("../services/adminService.js");

async function queryAllUsers(req, res) {
  try {
    await adminService.queryAllUsers(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function removeUser(req, res) {
  try {
    await adminService.removeUser(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function approveUser(req, res) {
  try {
    await adminService.approveUser(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  queryAllUsers,
  removeUser,
  approveUser
};
