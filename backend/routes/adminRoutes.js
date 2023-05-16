const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/queryAllUsers', adminController.queryAllUsers);
router.post('/removeUser', adminController.removeUser);
router.post('/approveUser', adminController.approveUser);


module.exports = router;
