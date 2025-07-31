const express = require('express');
const router = express.Router();
const checkoutController = require('../../controller/ui/checkout.ui.controller');
const { authMiddleware } = require('../../middleware/Auth');

// Checkout page
router.get('/', authMiddleware, checkoutController.checkoutPage);

// Address management
router.post('/address/add', authMiddleware, checkoutController.addAddress);
router.put('/address/:addressId', authMiddleware, checkoutController.updateAddress);
router.delete('/address/:addressId', authMiddleware, checkoutController.deleteAddress);
router.post('/address/:addressId/default', authMiddleware, checkoutController.setDefaultAddress);

module.exports = router;