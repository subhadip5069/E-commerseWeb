const express = require('express');
const router = express.Router();

const UserAuthController = require('../../controller/ui/otp.verification');

router.post('/auth/signup',UserAuthController.signup);
router.post('/auth/verify-otp',UserAuthController.verifyOTP);
router.post('/auth/login',UserAuthController.login);
router.get('/auth/logout',UserAuthController.logout);

module.exports = router;