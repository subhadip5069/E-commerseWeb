const express = require('express');
const router = express.Router();

const bookingsUiController = require('../../controller/admin/bookings.ui.controller');
const { AdminauthMiddleware } = require('../../middleware/Auth');

router.get('/',AdminauthMiddleware,bookingsUiController.getPurchases)

module.exports = router