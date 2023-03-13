const express = require("express");
const queueController = require("../controllers/queueController");

const router = express.Router();

router.post("/submit", queueController.submit);
router.get('/jobStatus', queueController.getJobStatus)
router.get('/getJobReturnData', queueController.getJobReturnData)
router.post('/retryJob', queueController.retryJob)
router.post('/updateJobName', queueController.updateJobName)

module.exports = router;
