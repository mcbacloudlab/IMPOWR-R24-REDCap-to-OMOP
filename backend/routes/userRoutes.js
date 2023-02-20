const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// router.get('/', userController.getAllUsers);
router.get('/getUserById', userController.getUserById);
router.post('/createUser', userController.createUser);
router.post('/signInUser', userController.signInUser);
router.post('/validateUser', userController.validateUser);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

module.exports = router;
