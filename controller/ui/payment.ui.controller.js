const paymentService = require('../../services/paymentService');
const Order = require('../../model/order');
const Payment = require('../../model/payment');
const Cart = require('../../model/cart');
const Product = require('../../model/product');
const User = require('../../model/user');
const crypto = require('crypto');

class PaymentController {
    
    /**
     * Create order and initiate payment
     */
    createOrder = async (req, res) => {
        try {
            const userId = req.user.id;
            const { 
                items, 
                shippingAddress, 
                billingAddress, 
                paymentMethod, 
                couponCode,
                customerNotes 
            } = req.body;

            // Validate user authentication
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Validate required fields
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Order items are required'
                });
            }

            if (!shippingAddress || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Shipping address and payment method are required'
                });
            }

            // Validate and calculate order amounts
            const orderCalculation = await this.calculateOrderAmounts(items, couponCode);
            
            if (!orderCalculation.success) {
                return res.status(400).json(orderCalculation);
            }

            // Create order
            const orderData = {
                userId,
                items: orderCalculation.items,
                pricing: orderCalculation.pricing,
                shippingAddress,
                billingAddress: billingAddress || shippingAddress,
                paymentMethod,
                coupon: orderCalculation.coupon,
                customerNotes,
                source: 'web',
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            };

            const order = new Order(orderData);
            await order.save();

            // If COD, mark order as confirmed and skip payment gateway
            if (paymentMethod === 'cod') {
                order.paymentStatus = 'pending';
                order.status = 'confirmed';
                await order.save();

                // Clear user's cart
                await this.clearUserCart(userId);

                return res.json({
                    success: true,
                    message: 'Order placed successfully with Cash on Delivery',
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    redirectUrl: `/order-success?orderId=${order._id}`
                });
            }

            // Create payment order for other gateways
            const paymentOrderData = {
                gateway: paymentMethod,
                amount: orderCalculation.pricing.total,
                currency: process.env.DEFAULT_CURRENCY || 'INR',
                orderId: order._id,
                userId,
                metadata: {
                    customerEmail: shippingAddress.email,
                    customerPhone: shippingAddress.phone,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            };

            const paymentResult = await paymentService.createPaymentOrder(paymentOrderData);

            if (paymentResult.success) {
                // Update order with payment ID
                order.paymentId = paymentResult.paymentId;
                await order.save();

                return res.json({
                    success: true,
                    message: 'Payment order created successfully',
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    paymentId: paymentResult.paymentId,
                    gatewayData: paymentResult.gatewayData,
                    clientSecret: paymentResult.clientSecret,
                    amount: orderCalculation.pricing.total,
                    currency: process.env.DEFAULT_CURRENCY || 'INR'
                });
            } else {
                // Delete the order if payment creation failed
                await Order.findByIdAndDelete(order._id);
                
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create payment order'
                });
            }

        } catch (error) {
            console.error('Error creating order:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    /**
     * Verify payment after successful gateway transaction
     */
    verifyPayment = async (req, res) => {
        try {
            const { 
                paymentId, 
                gateway, 
                gatewayPaymentId, 
                gatewayOrderId, 
                signature 
            } = req.body;

            if (!paymentId || !gateway) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment ID and gateway are required'
                });
            }

            const verificationData = {
                gateway,
                paymentId,
                signature,
                gatewayPaymentId,
                gatewayOrderId
            };

            const verificationResult = await paymentService.verifyPayment(verificationData);

            if (verificationResult.success && verificationResult.verified) {
                // Clear user's cart after successful payment
                const payment = await Payment.findById(paymentId);
                if (payment) {
                    await this.clearUserCart(payment.userId);
                }

                return res.json({
                    success: true,
                    message: 'Payment verified successfully',
                    verified: true,
                    redirectUrl: `/payment-success?paymentId=${paymentId}`
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Payment verification failed',
                    verified: false,
                    error: verificationResult.error
                });
            }

        } catch (error) {
            console.error('Error verifying payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Payment verification error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    /**
     * Get payment status
     */
    getPaymentStatus = async (req, res) => {
        try {
            const { paymentId } = req.params;

            if (!paymentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment ID is required'
                });
            }

            const statusResult = await paymentService.getPaymentStatus(paymentId);

            return res.json(statusResult);

        } catch (error) {
            console.error('Error fetching payment status:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching payment status',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    /**
     * Handle payment success page
     */
    paymentSuccessPage = async (req, res) => {
        try {
            const { paymentId, orderId } = req.query;
            
            let order, payment;

            if (paymentId) {
                payment = await Payment.findById(paymentId).populate('orderId');
                order = payment?.orderId;
            } else if (orderId) {
                order = await Order.findById(orderId).populate('paymentId');
                payment = order?.paymentId;
            }

            if (!order) {
                return res.status(404).render('error', {
                    message: 'Order not found'
                });
            }

            res.render('Ui/paymentSuccess', {
                title: 'Payment Successful',
                order,
                payment,
                user: req.user
            });

        } catch (error) {
            console.error('Error loading payment success page:', error);
            res.status(500).render('error', {
                message: 'Error loading page'
            });
        }
    };

    /**
     * Handle payment failure page
     */
    paymentFailurePage = async (req, res) => {
        try {
            const { paymentId, error } = req.query;
            
            let payment;
            if (paymentId) {
                payment = await Payment.findById(paymentId).populate('orderId');
            }

            res.render('Ui/paymentFailure', {
                title: 'Payment Failed',
                payment,
                error: error || 'Payment was not successful',
                user: req.user
            });

        } catch (error) {
            console.error('Error loading payment failure page:', error);
            res.status(500).render('error', {
                message: 'Error loading page'
            });
        }
    };

    /**
     * Razorpay webhook handler
     */
    razorpayWebhook = async (req, res) => {
        try {
            const signature = req.get('x-razorpay-signature');
            const body = JSON.stringify(req.body);

            // Verify webhook signature
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(body)
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(400).json({ error: 'Invalid signature' });
            }

            const event = req.body;
            
            // Handle different webhook events
            switch (event.event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(event.payload.payment.entity);
                    break;
                    
                case 'payment.failed':
                    await this.handlePaymentFailed(event.payload.payment.entity);
                    break;
                    
                case 'order.paid':
                    await this.handleOrderPaid(event.payload.order.entity);
                    break;
                    
                default:
                    console.log('Unhandled Razorpay webhook event:', event.event);
            }

            res.json({ status: 'ok' });

        } catch (error) {
            console.error('Razorpay webhook error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    };

    /**
     * Stripe webhook handler
     */
    stripeWebhook = async (req, res) => {
        try {
            const signature = req.get('stripe-signature');
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            
            const event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            // Handle different webhook events
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handleStripePaymentSucceeded(event.data.object);
                    break;
                    
                case 'payment_intent.payment_failed':
                    await this.handleStripePaymentFailed(event.data.object);
                    break;
                    
                default:
                    console.log('Unhandled Stripe webhook event:', event.type);
            }

            res.json({ received: true });

        } catch (error) {
            console.error('Stripe webhook error:', error);
            res.status(400).json({ error: 'Webhook processing failed' });
        }
    };

    /**
     * Request refund
     */
    requestRefund = async (req, res) => {
        try {
            const { paymentId } = req.params;
            const { amount, reason } = req.body;
            const userId = req.user.id;

            // Verify payment belongs to user
            const payment = await Payment.findById(paymentId);
            if (!payment || payment.userId.toString() !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            const refundResult = await paymentService.processRefund(paymentId, amount, reason);

            return res.json(refundResult);

        } catch (error) {
            console.error('Error processing refund:', error);
            return res.status(500).json({
                success: false,
                message: 'Error processing refund',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    // Helper methods

    /**
     * Calculate order amounts including tax, shipping, and discounts
     */
    async calculateOrderAmounts(items, couponCode) {
        try {
            const orderItems = [];
            let subtotal = 0;

            // Validate and calculate each item
            for (const item of items) {
                const product = await Product.findById(item.productId);
                
                if (!product || !product.isActive) {
                    return {
                        success: false,
                        message: `Product ${item.productId} not found or inactive`
                    };
                }

                if (product.stock < item.quantity) {
                    return {
                        success: false,
                        message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                    };
                }

                const itemTotal = product.currentPrice * item.quantity;
                subtotal += itemTotal;

                orderItems.push({
                    productId: product._id,
                    quantity: item.quantity,
                    price: product.currentPrice,
                    productSnapshot: {
                        name: product.name,
                        description: product.description,
                        images: product.images,
                        category: product.category,
                        subcategory: product.subcategory
                    }
                });
            }

            // Calculate tax (18% GST in India)
            const tax = subtotal * 0.18;

            // Calculate shipping (free for orders above ₹500)
            const shipping = subtotal >= 500 ? 0 : 70;

            // Apply coupon discount if provided
            let discount = 0;
            let coupon = null;

            if (couponCode) {
                // Implement coupon logic here
                // This is a placeholder implementation
                coupon = {
                    code: couponCode,
                    discountType: 'percentage',
                    discountValue: 10,
                    appliedDiscount: subtotal * 0.1
                };
                discount = coupon.appliedDiscount;
            }

            const total = subtotal + tax + shipping - discount;

            return {
                success: true,
                items: orderItems,
                pricing: {
                    subtotal,
                    tax,
                    shipping,
                    discount,
                    total
                },
                coupon
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error calculating order amounts',
                error: error.message
            };
        }
    }

    /**
     * Clear user's cart after successful order
     */
    async clearUserCart(userId) {
        try {
            await Cart.deleteMany({ userId });
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    }

    /**
     * Handle payment captured webhook
     */
    async handlePaymentCaptured(paymentEntity) {
        try {
            const payment = await Payment.findOne({ 
                gatewayPaymentId: paymentEntity.id 
            });

            if (payment) {
                await payment.markAsCompleted(paymentEntity);
                
                // Update order status
                const order = await Order.findById(payment.orderId);
                if (order) {
                    order.paymentStatus = 'completed';
                    order.status = 'confirmed';
                    await order.save();
                }
            }
        } catch (error) {
            console.error('Error handling payment captured webhook:', error);
        }
    }

    /**
     * Handle payment failed webhook
     */
    async handlePaymentFailed(paymentEntity) {
        try {
            const payment = await Payment.findOne({ 
                gatewayPaymentId: paymentEntity.id 
            });

            if (payment) {
                await payment.markAsFailed({
                    code: paymentEntity.error_code,
                    message: paymentEntity.error_description
                }, paymentEntity);
            }
        } catch (error) {
            console.error('Error handling payment failed webhook:', error);
        }
    }

    /**
     * Handle order paid webhook
     */
    async handleOrderPaid(orderEntity) {
        // Handle order paid events
        console.log('Order paid webhook received:', orderEntity);
    }

    /**
     * Handle Stripe payment succeeded
     */
    async handleStripePaymentSucceeded(paymentIntent) {
        try {
            const payment = await Payment.findOne({ 
                gatewayTransactionId: paymentIntent.id 
            });

            if (payment) {
                await payment.markAsCompleted(paymentIntent);
                
                // Update order status
                const order = await Order.findById(payment.orderId);
                if (order) {
                    order.paymentStatus = 'completed';
                    order.status = 'confirmed';
                    await order.save();
                }
            }
        } catch (error) {
            console.error('Error handling Stripe payment succeeded:', error);
        }
    }

    /**
     * Handle Stripe payment failed
     */
    async handleStripePaymentFailed(paymentIntent) {
        try {
            const payment = await Payment.findOne({ 
                gatewayTransactionId: paymentIntent.id 
            });

            if (payment) {
                await payment.markAsFailed({
                    code: paymentIntent.last_payment_error?.code,
                    message: paymentIntent.last_payment_error?.message
                }, paymentIntent);
            }
        } catch (error) {
            console.error('Error handling Stripe payment failed:', error);
        }
    }
}

module.exports = new PaymentController();
