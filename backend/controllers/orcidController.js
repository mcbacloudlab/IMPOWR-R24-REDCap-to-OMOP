const orcidService = require("../services/orcidService.js");

async function orcidLogin(req, res) {
  try {
    await orcidService.orcidLogin(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function orcidCallback(req, res) {
  try {
    await orcidService.orcidCallback(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

async function orcidLogout(req, res) {
  try {
    await orcidService.orcidLogout(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
}

module.exports = {
  orcidLogin,
  orcidCallback,
  orcidLogout
};
