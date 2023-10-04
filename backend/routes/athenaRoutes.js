const express = require('express');
const athenaController = require('../controllers/athenaController');

const router = express.Router();

router.post('/getDataByConceptID', athenaController.getDataByConceptID);
router.post('/getDetailDataByConceptID', athenaController.getDetailDataByConceptID);

module.exports = router;
