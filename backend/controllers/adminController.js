const adminService = require("../services/adminService.js");

async function queryAllUsers(req, res) {
  try {
    await adminService.queryAllUsers(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  queryAllUsers,
};
