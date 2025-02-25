const express = require('express');
const router = express.Router();


const addressController = require('../../controller/ui/address.ui.controller');
const {authMiddleware} = require('../../middleware/Auth');


router.post('/create',authMiddleware,addressController.createAddress)
router.get('/delete/:id',authMiddleware,addressController.deleteAddress)
router.post('/update/:id',authMiddleware,addressController.updateAddress)
router.get('/',authMiddleware,addressController.getUserAddresses)


module.exports = router