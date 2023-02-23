const express = require('express');
const keyController = require('../controllers/keyController');

const router = express.Router();

router.get('/queryAllKeys', keyController.queryAllKeys);
router.get('/testRedcapAPI', keyController.testRedcapAPI);
router.get('/testUMLSAPI', keyController.testUMLSAPI);
router.post('/updateRedcapKey', keyController.updateRedcapKey);

module.exports = router;
