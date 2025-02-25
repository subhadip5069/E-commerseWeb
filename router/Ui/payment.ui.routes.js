const express = require('express');
const router = express.Router();
const paymentUiController = require('../../controller/ui/payment.ui.controller');
const {authMiddleware} = require('../../middleware/Auth');

router.post('/create',authMiddleware,paymentUiController.createPurchase)
router.get('/bill/:id',authMiddleware,paymentUiController.getPurchaseById)

module.exports = router