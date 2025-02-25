const express = require('express');
const router = express.Router();

const purchaseUiController = require('../../controller/admin/order.ui.controller');
const { AdminauthMiddleware } = require('../../middleware/Auth');

router.get('/',AdminauthMiddleware,purchaseUiController.getAllPurchases)
router.get('/user/:userId',AdminauthMiddleware,purchaseUiController.getPurchasesByUser)
router.get('/delete/:purchaseId',AdminauthMiddleware,purchaseUiController.deletePurchase)

module.exports = router