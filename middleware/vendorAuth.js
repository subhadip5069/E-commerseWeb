const jwt = require('jsonwebtoken');
const Vendor = require('../model/vendor');

// Vendor authentication middleware
const vendorAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.vendorToken || req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            req.flash('error_msg', 'Please login to access this page');
            return res.redirect('/vendor/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const vendor = await Vendor.findById(decoded.id);

        if (!vendor) {
            req.flash('error_msg', 'Vendor not found. Please login again.');
            return res.redirect('/vendor/login');
        }

        if (!vendor.isActive) {
            req.flash('error_msg', 'Your account has been deactivated. Please contact support.');
            return res.redirect('/vendor/login');
        }

        if (vendor.isBlocked) {
            req.flash('error_msg', 'Your account has been blocked. Please contact support.');
            return res.redirect('/vendor/login');
        }

        req.vendor = vendor;
        req.user = vendor; // For compatibility
        next();
    } catch (error) {
        console.error('Vendor auth middleware error:', error);
        req.flash('error_msg', 'Authentication failed. Please login again.');
        res.redirect('/vendor/login');
    }
};

// Check if vendor is verified
const verifiedVendorMiddleware = (req, res, next) => {
    if (!req.vendor) {
        req.flash('error_msg', 'Please login first');
        return res.redirect('/vendor/login');
    }

    if (req.vendor.verificationStatus !== 'Approved') {
        req.flash('error_msg', 'Your account is not yet verified. Please complete verification process.');
        return res.redirect('/vendor/verification');
    }

    next();
};

// Generate vendor JWT token
const generateVendorToken = (vendorId) => {
    return jwt.sign(
        { id: vendorId, type: 'vendor' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );
};

// Optional vendor auth (doesn't redirect, just sets vendor if authenticated)
const optionalVendorAuth = async (req, res, next) => {
    try {
        const token = req.cookies.vendorToken || req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const vendor = await Vendor.findById(decoded.id);
            
            if (vendor && vendor.isActive && !vendor.isBlocked) {
                req.vendor = vendor;
                req.user = vendor;
            }
        }
    } catch (error) {
        // Silently fail for optional auth
        console.log('Optional vendor auth failed:', error.message);
    }
    
    next();
};

module.exports = {
    vendorAuthMiddleware,
    verifiedVendorMiddleware,
    generateVendorToken,
    optionalVendorAuth
};