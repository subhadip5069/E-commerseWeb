const express = require('express');
const router = express.Router();
const adminVendorController = require('../../controller/admin/vendor.controller');
const { AdminauthMiddleware } = require('../../middleware/Auth');

// Apply admin authentication to all routes
router.use(AdminauthMiddleware);

// Vendor listing and management
router.get('/', adminVendorController.listVendors);
router.get('/list', adminVendorController.listVendors);

// View vendor details
router.get('/view/:id', adminVendorController.viewVendor);

// Vendor approval/rejection
router.post('/approve/:id', adminVendorController.approveVendor);
router.post('/reject/:id', adminVendorController.rejectVendor);

// Vendor block/unblock
router.post('/block/:id', adminVendorController.blockVendor);
router.post('/unblock/:id', adminVendorController.unblockVendor);

// Update vendor commission
router.post('/commission/:id', adminVendorController.updateCommission);

// Vendor products management
router.get('/:id/products', adminVendorController.vendorProducts);
router.post('/:vendorId/products/:productId/approve', adminVendorController.approveProduct);
router.post('/:vendorId/products/:productId/reject', adminVendorController.rejectProduct);

// Bulk actions
router.post('/bulk-action', adminVendorController.bulkAction);

module.exports = router;