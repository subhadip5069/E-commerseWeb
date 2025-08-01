const express = require('express');
const router = express.Router();
const vendorDashboardController = require('../../controller/vendor/dashboard.controller');
const { vendorAuthMiddleware } = require('../../middleware/vendorAuth');

// Apply vendor authentication to all routes
router.use(vendorAuthMiddleware);

// Dashboard route
router.get('/', vendorDashboardController.dashboard);
router.get('/dashboard', vendorDashboardController.dashboard);

// Profile routes
router.get('/profile', vendorDashboardController.profile);
router.post('/profile', vendorDashboardController.updateProfile);

// Settings routes
router.get('/settings', vendorDashboardController.settings);
router.post('/settings', vendorDashboardController.updateSettings);

// Verification route
router.get('/verification', vendorDashboardController.verification);

// Analytics route
router.get('/analytics', vendorDashboardController.analytics);

// Bank details routes
router.get('/bank-details', vendorDashboardController.bankDetails);
router.post('/bank-details', vendorDashboardController.updateBankDetails);

module.exports = router;