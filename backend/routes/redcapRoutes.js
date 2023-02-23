const express = require('express');
const redcapController = require('../controllers/redcapController');

const router = express.Router();

router.get('/getForms', redcapController.getForms);

module.exports = router;
