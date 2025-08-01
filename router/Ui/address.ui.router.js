const express = require('express');
const router = express.Router();
const addressController = require('../../controller/ui/address.ui.controller');
const { authMiddleware } = require('../../middleware/Auth');

// Address management routes
router.get('/', authMiddleware, addressController.getUserAddresses);
router.get('/add', authMiddleware, addressController.showAddAddressForm);
router.post('/add', authMiddleware, addressController.createAddress);
router.get('/edit/:addressId', authMiddleware, addressController.showEditAddressForm);
router.post('/edit/:addressId', authMiddleware, addressController.updateAddress);
router.post('/delete/:addressId', authMiddleware, addressController.deleteAddress);
router.post('/set-default/:addressId', authMiddleware, addressController.setDefaultAddress);

// Checkout related address routes
router.get('/select-for-checkout', authMiddleware, addressController.selectAddressForCheckout);
router.get('/api/checkout-addresses', authMiddleware, addressController.getAddressesForCheckout);

module.exports = router;