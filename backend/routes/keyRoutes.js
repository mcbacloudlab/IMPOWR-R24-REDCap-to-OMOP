const express = require('express');
const keyController = require('../controllers/keyController');

const router = express.Router();

router.get('/queryAllKeys', keyController.queryAllKeys);
router.post('/updateRedcapKey', keyController.updateRedcapKey);

module.exports = router;
