const express = require('express');
const umlsController = require('../controllers/umlsController');

const router = express.Router();

router.post('/getUMLSSearchResults', umlsController.getUMLSSearchResults);

module.exports = router;
