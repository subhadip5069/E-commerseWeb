const express = require('express');
const router = express.Router();
const vendorAuthController = require('../../controller/vendor/auth.controller');
const { optionalVendorAuth } = require('../../middleware/vendorAuth');

// Registration routes
router.get('/register', optionalVendorAuth, vendorAuthController.showRegisterForm);
router.post('/register', vendorAuthController.register);

// Login routes
router.get('/login', optionalVendorAuth, vendorAuthController.showLoginForm);
router.post('/login', vendorAuthController.login);

// Logout route
router.get('/logout', vendorAuthController.logout);
router.post('/logout', vendorAuthController.logout);

// Forgot password routes
router.get('/forgot-password', vendorAuthController.showForgotPasswordForm);
router.post('/forgot-password', vendorAuthController.forgotPassword);

// Reset password routes
router.get('/reset-password/:token', vendorAuthController.showResetPasswordForm);
router.post('/reset-password/:token', vendorAuthController.resetPassword);

module.exports = router;