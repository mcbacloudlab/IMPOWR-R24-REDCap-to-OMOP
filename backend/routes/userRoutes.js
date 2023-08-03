const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/getUserByEmail', userController.getUserByEmail);
router.post('/createUser', userController.createUser);
router.post('/signInUser', userController.signInUser);
router.post('/validateUser', userController.validateUser);
router.get('/getUserJobs', userController.getUserJobs);
router.get('/getAllUserJobs', userController.getAllUserJobs);
router.post('/changeUserPassword', userController.changeUserPassword);


module.exports = router;
