const express = require('express');
const router = express.Router();
const paymentController = require('../../controller/ui/payment.ui.controller');
const { authMiddleware } = require('../../middleware/Auth');

// Order and payment creation  
router.post('/create-order', authMiddleware, paymentController.createOrder);
router.post('/create', authMiddleware, paymentController.createOrder); // Alternative route for compatibility

// Payment verification
router.post('/verify-payment', authMiddleware, paymentController.verifyPayment);

// Payment status
router.get('/status/:paymentId', authMiddleware, paymentController.getPaymentStatus);

// Payment success and failure pages
router.get('/success', paymentController.paymentSuccessPage);
router.get('/failure', paymentController.paymentFailurePage);

// Webhook endpoints (no authentication required for webhooks)
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), paymentController.razorpayWebhook);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// Refund processing
router.post('/refund/:paymentId', authMiddleware, paymentController.requestRefund);

module.exports = router;