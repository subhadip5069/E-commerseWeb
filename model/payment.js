const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Order reference
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Payment gateway information
    gateway: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'cod'], // Cash on Delivery
        required: true
    },
    
    // Gateway-specific transaction ID
    gatewayTransactionId: {
        type: String,
        required: function() {
            return this.gateway !== 'cod';
        }
    },
    
    // Gateway-specific payment ID (for Razorpay)
    gatewayPaymentId: {
        type: String
    },
    
    // Gateway-specific order ID
    gatewayOrderId: {
        type: String
    },
    
    // Payment amount
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Currency
    currency: {
        type: String,
        default: 'INR',
        required: true
    },
    
    // Payment status
    status: {
        type: String,
        enum: [
            'pending',      // Payment initiated
            'processing',   // Payment in progress
            'completed',    // Payment successful
            'failed',       // Payment failed
            'cancelled',    // Payment cancelled
            'refunded',     // Payment refunded
            'partially_refunded' // Partial refund
        ],
        default: 'pending'
    },
    
    // Payment method details
    paymentMethod: {
        type: {
            type: String,
            enum: ['card', 'netbanking', 'upi', 'wallet', 'cod', 'emi']
        },
        details: {
            // For cards
            last4: String,
            brand: String,
            
            // For UPI
            vpa: String,
            
            // For net banking
            bank: String,
            
            // For wallets
            wallet: String
        }
    },
    
    // Fees and charges
    fees: {
        gateway: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    
    // Refund information
    refunds: [{
        refundId: String,
        amount: Number,
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'processed', 'failed']
        },
        processedAt: Date,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Payment timestamps
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    
    completedAt: {
        type: Date
    },
    
    failedAt: {
        type: Date
    },
    
    // Failure reason
    failureReason: {
        code: String,
        message: String
    },
    
    // Gateway response data
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // Webhook data
    webhookData: [{
        event: String,
        data: mongoose.Schema.Types.Mixed,
        receivedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Additional metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        customerEmail: String,
        customerPhone: String,
        notes: String
    },
    
    // Risk assessment
    riskScore: {
        type: Number,
        min: 0,
        max: 100
    },
    
    // Dispute information
    disputes: [{
        disputeId: String,
        reason: String,
        amount: Number,
        status: String,
        createdAt: Date,
        resolvedAt: Date
    }]
}, {
    timestamps: true
});

// Indexes for better performance
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ gateway: 1, status: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ 'metadata.customerEmail': 1 });

// Virtual for total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
    return this.refunds.reduce((total, refund) => {
        return refund.status === 'processed' ? total + refund.amount : total;
    }, 0);
});

// Virtual for net amount (amount - refunds)
paymentSchema.virtual('netAmount').get(function() {
    return this.amount - this.totalRefunded;
});

// Methods
paymentSchema.methods.markAsCompleted = function(gatewayResponse) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (gatewayResponse) {
        this.gatewayResponse = gatewayResponse;
    }
    return this.save();
};

paymentSchema.methods.markAsFailed = function(reason, gatewayResponse) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    if (gatewayResponse) {
        this.gatewayResponse = gatewayResponse;
    }
    return this.save();
};

paymentSchema.methods.addRefund = function(refundData) {
    this.refunds.push(refundData);
    
    // Update payment status if fully refunded
    if (this.totalRefunded >= this.amount) {
        this.status = 'refunded';
    } else if (this.totalRefunded > 0) {
        this.status = 'partially_refunded';
    }
    
    return this.save();
};

// Static methods
paymentSchema.statics.findByGatewayId = function(gatewayTransactionId) {
    return this.findOne({ gatewayTransactionId });
};

paymentSchema.statics.getPaymentStats = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
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
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
};

module.exports = mongoose.model('Payment', paymentSchema);