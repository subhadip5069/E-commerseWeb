const express = require('express');
const router = express.Router();

const purchaseUiController = require('../../controller/admin/poster.ui.controller');

router.get('/',purchaseUiController.getAllPosters)
router.post('/add',purchaseUiController.addPoster)
router.get('/delete/:posterId',purchaseUiController.deletePoster)

module.exports = router