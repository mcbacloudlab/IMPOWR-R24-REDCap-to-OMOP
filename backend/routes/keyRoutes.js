const express = require('express');
const keyController = require('../controllers/keyController');

const router = express.Router();

router.get('/queryAllKeys', keyController.queryAllKeys);
router.get('/testRedcapAPI', keyController.testRedcapAPI);
router.get('/testUMLSAPI', keyController.testUMLSAPI);
router.get('/testGPT3API', keyController.testGPT3API);
router.post('/updateAPIKey', keyController.updateAPIKey);

module.exports = router;
