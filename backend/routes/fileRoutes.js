const express = require('express');
const fileController = require('../controllers/fileController');

const router = express.Router();

router.get('/get_data_dictionary_list', fileController.getDDList);
router.post('/get_data_dictionary', fileController.getDD);
router.post('/add_data_dictionary', fileController.addDD);
router.post('/remove_data_dictionary', fileController.removeDD);
router.post('/save_data_dictionary', fileController.saveDD);

module.exports = router;
