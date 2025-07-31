const Razorpay = require('razorpay');
const Stripe = require('stripe');
const paypal = require('@paypal/paypal-server-sdk');
const crypto = require('crypto');
const Payment = require('../model/payment');
const Order = require('../model/order');
const emailService = require('./emailService');

class PaymentService {
    constructor() {
        this.initializeGateways();
    }

    initializeGateways() {
        // Initialize Razorpay
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            this.razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
        }

        // Initialize Stripe
        if (process.env.STRIPE_SECRET_KEY) {
            this.stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        }

        // Initialize PayPal
        if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
            const environment = process.env.PAYPAL_ENVIRONMENT === 'production' 
                ? paypal.core.LiveEnvironment 
                : paypal.core.SandboxEnvironment;
            
            this.paypalClient = new paypal.core.PayPalHttpClient(
                new environment(
                    process.env.PAYPAL_CLIENT_ID,
                    process.env.PAYPAL_CLIENT_SECRET
                )
            );
        }
    }

    /**
     * Create payment order based on gateway
     */
    async createPaymentOrder(orderData) {
        const { gateway, amount, currency, orderId, userId, metadata } = orderData;

        try {
            let gatewayResponse;
            let paymentData = {
                orderId,
                userId,
                gateway,
                amount,
                currency: currency || process.env.DEFAULT_CURRENCY || 'INR',
                status: 'pending',
                metadata
            };

            switch (gateway) {
                case 'razorpay':
                    gatewayResponse = await this.createRazorpayOrder(amount, currency, orderId);
                    paymentData.gatewayOrderId = gatewayResponse.id;
                    break;

                case 'stripe':
                    gatewayResponse = await this.createStripePaymentIntent(amount, currency, orderId);
                    paymentData.gatewayTransactionId = gatewayResponse.id;
                    paymentData.gatewayOrderId = gatewayResponse.id;
                    break;

                case 'paypal':
                    gatewayResponse = await this.createPayPalOrder(amount, currency, orderId);
                    paymentData.gatewayOrderId = gatewayResponse.id;
                    break;

                case 'cod':
                    // Cash on delivery - no gateway interaction needed
                    gatewayResponse = { id: `COD-${Date.now()}` };
                    paymentData.gatewayTransactionId = gatewayResponse.id;
                    paymentData.status = 'pending';
                    break;

                default:
                    throw new Error('Unsupported payment gateway');
            }

            paymentData.gatewayResponse = gatewayResponse;

            // Save payment record
            const payment = new Payment(paymentData);
            await payment.save();

            return {
                success: true,
                paymentId: payment._id,
                gatewayData: gatewayResponse,
                clientSecret: gatewayResponse.client_secret, // For Stripe
                orderData: {
                    id: gatewayResponse.id,
                    amount,
                    currency,
                    gateway
                }
            };
        } catch (error) {
            console.error('Error creating payment order:', error);
            throw new Error(`Failed to create payment order: ${error.message}`);
        }
    }

    /**
     * Razorpay order creation
     */
    async createRazorpayOrder(amount, currency, orderId) {
        if (!this.razorpay) {
            throw new Error('Razorpay not configured');
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in smallest currency unit
            currency: currency || 'INR',
            receipt: `order_${orderId}`,
            payment_capture: 1
        };

        return await this.razorpay.orders.create(options);
    }

    /**
     * Stripe payment intent creation
     */
    async createStripePaymentIntent(amount, currency, orderId) {
        if (!this.stripe) {
            throw new Error('Stripe not configured');
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in smallest currency unit
            currency: currency?.toLowerCase() || 'inr',
            metadata: {
                orderId: orderId.toString()
            },
            automatic_payment_methods: {
                enabled: true
            }
        });

        return paymentIntent;
    }

    /**
     * PayPal order creation
     */
    async createPayPalOrder(amount, currency, orderId) {
        if (!this.paypalClient) {
            throw new Error('PayPal not configured');
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: orderId.toString(),
                amount: {
                    currency_code: currency || 'USD',
                    value: amount.toFixed(2)
                }
            }],
            application_context: {
                return_url: process.env.PAYMENT_SUCCESS_URL,
                cancel_url: process.env.PAYMENT_CANCEL_URL
            }
        });

        const response = await this.paypalClient.execute(request);
        return response.result;
    }

    /**
     * Verify payment based on gateway
     */
    async verifyPayment(paymentData) {
        const { gateway, paymentId, signature, gatewayPaymentId, gatewayOrderId } = paymentData;

        try {
            let verificationResult;

            switch (gateway) {
                case 'razorpay':
                    verificationResult = await this.verifyRazorpayPayment({
                        razorpay_payment_id: gatewayPaymentId,
                        razorpay_order_id: gatewayOrderId,
                        razorpay_signature: signature
                    });
                    break;

                case 'stripe':
                    verificationResult = await this.verifyStripePayment(gatewayPaymentId);
                    break;

                case 'paypal':
                    verificationResult = await this.verifyPayPalPayment(gatewayPaymentId);
                    break;

                case 'cod':
                    // COD verification is handled differently
                    verificationResult = { verified: true, paymentDetails: { status: 'pending' } };
                    break;

                default:
                    throw new Error('Unsupported payment gateway');
            }

            if (verificationResult.verified) {
                await this.handleSuccessfulPayment(paymentId, verificationResult.paymentDetails);
                return { success: true, verified: true };
            } else {
                await this.handleFailedPayment(paymentId, verificationResult.error);
                return { success: false, verified: false, error: verificationResult.error };
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            await this.handleFailedPayment(paymentId, error.message);
            throw error;
        }
    }

    /**
     * Verify Razorpay payment signature
     */
    async verifyRazorpayPayment(paymentData) {
        try {
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;

            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (generatedSignature === razorpay_signature) {
                // Fetch payment details from Razorpay
                const paymentDetails = await this.razorpay.payments.fetch(razorpay_payment_id);
                return { verified: true, paymentDetails };
            } else {
                return { verified: false, error: 'Invalid signature' };
            }
        } catch (error) {
            return { verified: false, error: error.message };
        }
    }

    /**
     * Verify Stripe payment
     */
    async verifyStripePayment(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.status === 'succeeded') {
                return { verified: true, paymentDetails: paymentIntent };
            } else {
                return { verified: false, error: `Payment status: ${paymentIntent.status}` };
            }
        } catch (error) {
            return { verified: false, error: error.message };
        }
    }

    /**
     * Verify PayPal payment
     */
    async verifyPayPalPayment(orderId) {
        try {
            const request = new paypal.orders.OrdersGetRequest(orderId);
            const response = await this.paypalClient.execute(request);
            
            const order = response.result;
            if (order.status === 'COMPLETED') {
                return { verified: true, paymentDetails: order };
            } else {
                return { verified: false, error: `Order status: ${order.status}` };
            }
        } catch (error) {
            return { verified: false, error: error.message };
        }
    }

    /**
     * Handle successful payment
     */
    async handleSuccessfulPayment(paymentId, paymentDetails) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment record not found');
            }

            // Update payment record
            await payment.markAsCompleted(paymentDetails);

            // Update order status
            const order = await Order.findById(payment.orderId);
            if (order) {
                order.paymentStatus = 'completed';
                order.status = 'confirmed';
                order.paymentId = payment._id;
                await order.save();

                // Send order confirmation email
                const user = await require('../model/user').findById(order.userId);
                if (user) {
                    await emailService.sendOrderConfirmationEmail(
                        user.email,
                        user.username,
                        {
                            orderId: order.orderNumber,
                            total: order.pricing.total
                        }
                    );
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error handling successful payment:', error);
            throw error;
        }
    }

    /**
     * Handle failed payment
     */
    async handleFailedPayment(paymentId, errorMessage) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment record not found');
            }

            // Update payment record
            await payment.markAsFailed({
                code: 'PAYMENT_FAILED',
                message: errorMessage
            });

            // Update order status
            const order = await Order.findById(payment.orderId);
            if (order) {
                order.paymentStatus = 'failed';
                await order.save();
            }

            return { success: true };
        } catch (error) {
            console.error('Error handling failed payment:', error);
            throw error;
        }
    }

    /**
     * Process refund
     */
    async processRefund(paymentId, refundAmount, reason) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment record not found');
            }

            if (payment.status !== 'completed') {
                throw new Error('Can only refund completed payments');
            }

            let refundResult;

            switch (payment.gateway) {
                case 'razorpay':
                    refundResult = await this.processRazorpayRefund(payment, refundAmount);
                    break;

                case 'stripe':
                    refundResult = await this.processStripeRefund(payment, refundAmount);
                    break;

                case 'paypal':
                    refundResult = await this.processPayPalRefund(payment, refundAmount);
                    break;

                case 'cod':
                    // For COD, mark as refunded manually
                    refundResult = {
                        success: true,
                        refundId: `COD_REFUND_${Date.now()}`,
                        amount: refundAmount
                    };
                    break;

                default:
                    throw new Error('Refund not supported for this gateway');
            }

            if (refundResult.success) {
                // Update payment record
                await payment.addRefund({
                    refundId: refundResult.refundId,
                    amount: refundAmount,
                    reason,
                    status: 'processed',
                    processedAt: new Date()
                });

                // Update order status
                const order = await Order.findById(payment.orderId);
                if (order) {
                    if (refundAmount >= payment.amount) {
                        order.paymentStatus = 'refunded';
                        order.status = 'refunded';
                    } else {
                        order.paymentStatus = 'partially_refunded';
                    }
                    await order.save();
                }

                return { success: true, refundId: refundResult.refundId };
            } else {
                throw new Error(refundResult.error);
            }
        } catch (error) {
            console.error('Refund processing error:', error);
            throw error;
        }
    }

    /**
     * Process Razorpay refund
     */
    async processRazorpayRefund(payment, amount) {
        try {
            const refund = await this.razorpay.payments.refund(payment.gatewayPaymentId, {
                amount: Math.round(amount * 100)
            });

            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount / 100
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Process Stripe refund
     */
    async processStripeRefund(payment, amount) {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: payment.gatewayTransactionId,
                amount: Math.round(amount * 100)
            });

            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount / 100
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Process PayPal refund
     */
    async processPayPalRefund(payment, amount) {
        try {
            // This is a simplified implementation
            // In real scenario, you'd need to capture the payment first, then refund
            const request = new paypal.payments.RefundsPostRequest();
            request.requestBody({
                amount: {
                    value: amount.toFixed(2),
                    currency_code: payment.currency
                }
            });

            const response = await this.paypalClient.execute(request);
            
            return {
                success: true,
                refundId: response.result.id,
                amount: parseFloat(response.result.amount.value)
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId) {
        try {
            const payment = await Payment.findById(paymentId)
                .populate('orderId', 'orderNumber status')
                .populate('userId', 'username email');

            if (!payment) {
                throw new Error('Payment not found');
            }

            return {
                success: true,
                payment: {
                    id: payment._id,
                    gateway: payment.gateway,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    gatewayTransactionId: payment.gatewayTransactionId,
                    order: payment.orderId,
                    user: payment.userId,
                    createdAt: payment.createdAt,
                    completedAt: payment.completedAt,
                    refunds: payment.refunds
                }
            };
        } catch (error) {
            throw new Error(`Error fetching payment status: ${error.message}`);
        }
    }

    /**
     * Get payment analytics
     */
    async getPaymentAnalytics(startDate, endDate) {
        try {
            const analytics = await Payment.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            gateway: '$gateway',
                            status: '$status'
                        },
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        avgAmount: { $avg: '$amount' }
                    }
                },
                {
                    $sort: {
                        '_id.gateway': 1,
                        '_id.status': 1
                    }
                }
            ]);

            return { success: true, analytics };
        } catch (error) {
            throw new Error(`Error fetching payment analytics: ${error.message}`);
        }
    }
}

module.exports = new PaymentService();