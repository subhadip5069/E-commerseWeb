const express = require('express');
const router = express.Router();

const purchaseUiController = require('../../controller/admin/order.ui.controller');

router.get('/',purchaseUiController.getAllPurchases)
router.get('/user/:userId',purchaseUiController.getPurchasesByUser)
router.get('/delete/:purchaseId',purchaseUiController.deletePurchase)

module.exports = router