const express = require('express');
const orcidController = require('../controllers/orcidController');

const router = express.Router();

router.get('/orcidLogin', orcidController.orcidLogin);
router.get('/orcidCallback', orcidController.orcidCallback);
router.get('/orcidLogout', orcidController.orcidLogout);

module.exports = router;
