const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/queryAllUsers', adminController.queryAllUsers);
router.post('/removeUser', adminController.removeUser);
router.post('/approveUser', adminController.approveUser);
router.post('/updateUser', adminController.updateUser);


module.exports = router;
