const express = require('express');
const collectionController = require('../controllers/collectionController');

const router = express.Router();

router.get('/getCollectionNames', collectionController.getCollectionNames);
router.post('/updateCollectionAltName', collectionController.updateCollectionAltName);

module.exports = router;
