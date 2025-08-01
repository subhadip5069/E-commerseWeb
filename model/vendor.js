const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    // Basic Information
    businessName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    ownerName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 15
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    
    // Business Details
    businessType: {
        type: String,
        enum: ['Retail', 'Wholesale', 'Manufacturer', 'Distributor', 'Other'],
        default: 'Retail'
    },
    businessRegistrationNumber: {
        type: String,
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    
    // Address Information
    address: {
        street: { type: String, required: true, trim: true },
        landmark: { type: String, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        country: { type: String, default: 'India', trim: true },
        pincode: { type: Number, required: true },
    },
    
    // Bank Details
    bankDetails: {
        accountHolderName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        bankName: { type: String, trim: true },
        ifscCode: { type: String, trim: true, uppercase: true },
        branchName: { type: String, trim: true }
    },
    
    // Store Information
    storeDescription: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    storeLogo: {
        type: String,
        default: ''
    },
    storeBanner: {
        type: String,
        default: ''
    },
    storeCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    
    // Verification Status
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    isDocumentVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
        default: 'Pending'
    },
    verificationNotes: {
        type: String,
        trim: true
    },
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String,
        trim: true
    },
    
    // Performance Metrics
    totalProducts: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    
    // Commission Settings
    commissionRate: {
        type: Number,
        default: 10, // Percentage
        min: 0,
        max: 100
    },
    
    // Subscription Details
    subscriptionPlan: {
        type: String,
        enum: ['Basic', 'Premium', 'Enterprise'],
        default: 'Basic'
    },
    subscriptionExpiry: {
        type: Date
    },
    
    // Login Information
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    
    // OTP for verification
    emailOTP: {
        code: { type: String },
        expiresAt: { type: Date }
    },
    phoneOTP: {
        code: { type: String },
        expiresAt: { type: Date }
    },
    
    // Reset Password
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    
    // Documents
    documents: {
        businessLicense: { type: String },
        gstCertificate: { type: String },
        panCard: { type: String },
        addressProof: { type: String },
        bankStatement: { type: String }
    },
    
    // Vendor Settings
    settings: {
        autoAcceptOrders: { type: Boolean, default: true },
        allowCOD: { type: Boolean, default: true },
        processingTime: { type: Number, default: 1 }, // Days
        returnPolicy: { type: String, trim: true },
        shippingPolicy: { type: String, trim: true }
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
vendorSchema.index({ email: 1 });
vendorSchema.index({ phone: 1 });
vendorSchema.index({ businessName: 1 });
vendorSchema.index({ verificationStatus: 1 });
vendorSchema.index({ isActive: 1, isBlocked: 1 });
vendorSchema.index({ 'address.city': 1, 'address.state': 1 });

// Virtual for account lock status
vendorSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for verification completion percentage
vendorSchema.virtual('verificationProgress').get(function() {
    let progress = 0;
    if (this.isEmailVerified) progress += 20;
    if (this.isPhoneVerified) progress += 20;
    if (this.bankDetails.accountNumber) progress += 20;
    if (this.gstNumber) progress += 20;
    if (this.isDocumentVerified) progress += 20;
    return progress;
});

// Virtual for full address
vendorSchema.virtual('fullAddress').get(function() {
    const addr = this.address;
    return `${addr.street}, ${addr.landmark ? addr.landmark + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
});

// Methods
vendorSchema.methods.toJSON = function() {
    const vendor = this.toObject();
    delete vendor.password;
    delete vendor.resetPasswordToken;
    delete vendor.emailOTP;
    delete vendor.phoneOTP;
    return vendor;
};

// Increment failed login attempts
vendorSchema.methods.incLoginAttempts = function() {
    // If we have previous failed attempts and lockUntil has passed, reset attempts
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
    }
    
    return this.updateOne(updates);
};

// Reset login attempts
vendorSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Update performance metrics
vendorSchema.methods.updatePerformance = async function() {
    const Product = mongoose.model('Product');
    const Order = mongoose.model('Order');
    const Review = mongoose.model('Review');
    
    try {
        // Count total products
        const totalProducts = await Product.countDocuments({ vendor: this._id, isActive: true });
        
        // Count total orders and revenue (implement when order model is updated)
        // const orderStats = await Order.aggregate([
        //     { $match: { vendor: this._id, status: 'Delivered' } },
        //     { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } }
        // ]);
        
        // Calculate average rating (implement when review model is updated)
        // const reviewStats = await Review.aggregate([
        //     { $match: { vendor: this._id } },
        //     { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
        // ]);
        
        this.totalProducts = totalProducts;
        // this.totalOrders = orderStats[0]?.totalOrders || 0;
        // this.totalRevenue = orderStats[0]?.totalRevenue || 0;
        // this.averageRating = reviewStats[0]?.avgRating || 0;
        // this.totalReviews = reviewStats[0]?.totalReviews || 0;
        
        await this.save();
    } catch (error) {
        console.error('Error updating vendor performance:', error);
    }
};

// Static methods
vendorSchema.statics.findByCredentials = async function(email, password) {
    const bcrypt = require('bcryptjs');
    const vendor = await this.findOne({ email, isActive: true });
    
    if (!vendor) {
        throw new Error('Invalid credentials');
    }
    
    if (vendor.isLocked) {
        throw new Error('Account is locked. Please try again later.');
    }
    
    if (vendor.isBlocked) {
        throw new Error('Account is blocked. Please contact support.');
    }
    
    const isMatch = await bcrypt.compare(password, vendor.password);
    
    if (!isMatch) {
        await vendor.incLoginAttempts();
        throw new Error('Invalid credentials');
    }
    
    // Reset login attempts on successful login
    if (vendor.loginAttempts && vendor.loginAttempts > 0) {
        await vendor.resetLoginAttempts();
    }
    
    // Update last login
    vendor.lastLogin = new Date();
    await vendor.save();
    
    return vendor;
};

// Pre-save middleware to hash password
vendorSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Pre-save middleware to update verification status
vendorSchema.pre('save', function(next) {
    if (this.isEmailVerified && this.isPhoneVerified && this.isDocumentVerified) {
        if (this.verificationStatus === 'Pending') {
            this.verificationStatus = 'Under Review';
        }
    }
    next();
});

module.exports = mongoose.model('Vendor', vendorSchema);