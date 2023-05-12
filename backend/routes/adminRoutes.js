const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/queryAllUsers', adminController.queryAllUsers);


module.exports = router;
