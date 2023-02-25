const express = require('express');
const redcapController = require('../controllers/redcapController');

const router = express.Router();

router.get('/getForms', redcapController.getForms);
router.post('/exportMetadata', redcapController.exportMetadata);

module.exports = router;
