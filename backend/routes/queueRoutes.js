const express = require("express");
const queueController = require("../controllers/queueController");

const router = express.Router();

router.post("/submit", queueController.submit);
router.get('/jobStatus', queueController.getJobStatus)
router.get('/getJobReturnData', queueController.getJobReturnData)
router.post('/retryJob', queueController.retryJob)
router.post('/cancelJob', queueController.cancelJob)
router.post('/updateJobName', queueController.updateJobName)
router.post('/storeJobVerifyInfo', queueController.storeJobVerifyInfo);
router.post('/getJobVerifyInfo', queueController.getJobVerifyInfo);
router.post('/storeJobCompleteInfo', queueController.storeJobCompleteInfo);
router.post('/submitJobVerify', queueController.submitJobVerify);

module.exports = router;
