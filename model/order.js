const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
    // Unique order number for customer reference
    orderNumber: {
        type: String,
        unique: true,
        default: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Order items
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        // Snapshot of product details at time of order
        productSnapshot: {
            name: String,
            description: String,
            images: [String],
            sku: String,
            category: String,
            subcategory: String
        }
    }],
    
    // Order amounts
    pricing: {
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        tax: {
            type: Number,
            default: 0,
            min: 0
        },
        shipping: {
            type: Number,
            default: 0,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    },
    
    // Shipping information
    shippingAddress: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        addressLine1: {
            type: String,
            required: true
        },
        addressLine2: String,
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            default: 'India'
        }
    },
    
    // Billing address (if different from shipping)
    billingAddress: {
        name: String,
        email: String,
        phone: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    
    // Order status
    status: {
        type: String,
        enum: [
            'pending',          // Order created, payment pending
            'confirmed',        // Payment confirmed, order confirmed
            'processing',       // Order being prepared
            'shipped',          // Order shipped
            'out_for_delivery', // Out for delivery
            'delivered',        // Order delivered
            'cancelled',        // Order cancelled
            'returned',         // Order returned
            'refunded'          // Order refunded
        ],
        default: 'pending'
    },
    
    // Payment information
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'cod'],
        required: true
    },
    
    // Payment reference
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    
    // Coupon/Discount information
    coupon: {
        code: String,
        discountType: {
            type: String,
            enum: ['percentage', 'fixed']
        },
        discountValue: Number,
        appliedDiscount: Number
    },
    
    // Tracking information
    tracking: {
        carrier: String,
        trackingNumber: String,
        trackingUrl: String,
        estimatedDelivery: Date,
        actualDelivery: Date
    },
    
    // Order timeline
    timeline: [{
        status: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Customer notes
    customerNotes: String,
    
    // Internal notes (admin only)
    internalNotes: String,
    
    // Cancellation information
    cancellation: {
        reason: String,
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        cancelledAt: Date,
        refundAmount: Number,
        refundStatus: {
            type: String,
            enum: ['pending', 'processed', 'failed']
        }
    },
    
    // Return information
    return: {
        reason: String,
        requestedAt: Date,
        approvedAt: Date,
        rejectedAt: Date,
        returnedAt: Date,
        refundAmount: Number,
        status: {
            type: String,
            enum: ['requested', 'approved', 'rejected', 'completed']
        }
    },
    
    // Delivery attempts
    deliveryAttempts: [{
        attemptDate: Date,
        status: {
            type: String,
            enum: ['successful', 'failed', 'rescheduled']
        },
        reason: String,
        nextAttemptDate: Date
    }],
    
    // Order source
    source: {
        type: String,
        enum: ['web', 'mobile_app', 'admin'],
        default: 'web'
    },
    
    // Additional metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        referrer: String
    }
}, {
    timestamps: true
});

// Indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'shippingAddress.email': 1 });
orderSchema.index({ 'shippingAddress.phone': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to update timeline
orderSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.timeline.push({
            status: this.status,
            message: `Order status changed to ${this.status}`,
            timestamp: new Date()
        });
    }
    next();
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Methods
orderSchema.methods.updateStatus = function(newStatus, message, updatedBy) {
    this.status = newStatus;
    this.timeline.push({
        status: newStatus,
        message: message || `Order status changed to ${newStatus}`,
        timestamp: new Date(),
        updatedBy
    });
    return this.save();
};

orderSchema.methods.addTrackingInfo = function(trackingData) {
    this.tracking = {
        ...this.tracking,
        ...trackingData
    };
    
    if (trackingData.trackingNumber) {
        this.timeline.push({
            status: 'tracking_added',
            message: `Tracking number added: ${trackingData.trackingNumber}`,
            timestamp: new Date()
        });
    }
    
    return this.save();
};

orderSchema.methods.markAsDelivered = function(deliveryDate) {
    this.status = 'delivered';
    this.tracking.actualDelivery = deliveryDate || new Date();
    
    this.deliveryAttempts.push({
        attemptDate: deliveryDate || new Date(),
        status: 'successful'
    });
    
    this.timeline.push({
        status: 'delivered',
        message: 'Order successfully delivered',
        timestamp: deliveryDate || new Date()
    });
    
    return this.save();
};

orderSchema.methods.requestCancellation = function(reason, cancelledBy) {
    this.cancellation = {
        reason,
        cancelledBy,
        cancelledAt: new Date()
    };
    
    this.timeline.push({
        status: 'cancellation_requested',
        message: `Cancellation requested: ${reason}`,
        timestamp: new Date(),
        updatedBy: cancelledBy
    });
    
    return this.save();
};

orderSchema.methods.requestReturn = function(reason, userId) {
    this.return = {
        reason,
        requestedAt: new Date(),
        status: 'requested'
    };
    
    this.timeline.push({
        status: 'return_requested',
        message: `Return requested: ${reason}`,
        timestamp: new Date(),
        updatedBy: userId
    });
    
    return this.save();
};

// Static methods
orderSchema.statics.findByOrderNumber = function(orderNumber) {
    return this.findOne({ orderNumber });
};

orderSchema.statics.getOrderStats = function(startDate, endDate) {
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
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$pricing.total' },
                avgAmount: { $avg: '$pricing.total' }
            }
        }
    ]);
};

orderSchema.statics.getUserOrders = function(userId, limit = 10, skip = 0) {
    return this.find({ userId })
        .populate('items.productId', 'name images currentPrice')
        .populate('paymentId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

module.exports = mongoose.model('Order', orderSchema);