const express = require('express');
const router = express.Router();

const billController = require('../../controller/ui/bill.ui.controller');
const authMiddleware = require('../../middleware/Auth');

router.post('/pay',authMiddleware,billController.createBill)

module.exports = router;    