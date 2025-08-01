const Vendor = require('../../model/vendor');
const Product = require('../../model/product');
const Order = require('../../model/order');
const Category = require('../../model/category');
const mongoose = require('mongoose');

class VendorDashboardController {

    // Dashboard overview
    dashboard = async (req, res) => {
        try {
            const vendor = req.vendor;

            // Get dashboard statistics
            const stats = await this.getDashboardStats(vendor._id);

            // Get recent products
            const recentProducts = await Product.find({ vendor: vendor._id })
                .populate('category subcategory')
                .sort({ createdAt: -1 })
                .limit(5);

            // Get recent orders (when order model is updated with vendor field)
            // const recentOrders = await Order.find({ vendor: vendor._id })
            //     .populate('user', 'username email')
            //     .sort({ createdAt: -1 })
            //     .limit(5);

            res.render('Vendor/dashboard', {
                title: 'Vendor Dashboard',
                vendor,
                stats,
                recentProducts,
                // recentOrders: [],
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            req.flash('error_msg', 'Error loading dashboard');
            res.redirect('/vendor/login');
        }
    };

    // Get dashboard statistics
    getDashboardStats = async (vendorId) => {
        try {
            const stats = {
                totalProducts: 0,
                activeProducts: 0,
                pendingProducts: 0,
                totalOrders: 0,
                pendingOrders: 0,
                completedOrders: 0,
                totalRevenue: 0,
                monthlyRevenue: 0,
                averageRating: 0,
                totalReviews: 0
            };

            // Product statistics
            const productStats = await Product.aggregate([
                { $match: { vendor: new mongoose.Types.ObjectId(vendorId) } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        activeProducts: {
                            $sum: { $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $eq: ['$approvalStatus', 'Approved'] }] }, 1, 0] }
                        },
                        pendingProducts: {
                            $sum: { $cond: [{ $eq: ['$approvalStatus', 'Pending'] }, 1, 0] }
                        }
                    }
                }
            ]);

            if (productStats.length > 0) {
                stats.totalProducts = productStats[0].totalProducts;
                stats.activeProducts = productStats[0].activeProducts;
                stats.pendingProducts = productStats[0].pendingProducts;
            }

            // TODO: Add order statistics when order model is updated with vendor field
            // const orderStats = await Order.aggregate([
            //     { $match: { vendor: new mongoose.Types.ObjectId(vendorId) } },
            //     {
            //         $group: {
            //             _id: null,
            //             totalOrders: { $sum: 1 },
            //             pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['Pending', 'Processing']] }, 1, 0] } },
            //             completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
            //             totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, '$totalAmount', 0] } }
            //         }
            //     }
            // ]);

            // Get monthly revenue (current month)
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);

            // const monthlyStats = await Order.aggregate([
            //     {
            //         $match: {
            //             vendor: new mongoose.Types.ObjectId(vendorId),
            //             status: 'Delivered',
            //             createdAt: { $gte: currentMonth }
            //         }
            //     },
            //     {
            //         $group: {
            //             _id: null,
            //             monthlyRevenue: { $sum: '$totalAmount' }
            //         }
            //     }
            // ]);

            return stats;

        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                totalProducts: 0,
                activeProducts: 0,
                pendingProducts: 0,
                totalOrders: 0,
                pendingOrders: 0,
                completedOrders: 0,
                totalRevenue: 0,
                monthlyRevenue: 0,
                averageRating: 0,
                totalReviews: 0
            };
        }
    };

    // Vendor profile
    profile = async (req, res) => {
        try {
            const vendor = req.vendor;

            res.render('Vendor/profile', {
                title: 'Vendor Profile',
                vendor,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Profile error:', error);
            req.flash('error_msg', 'Error loading profile');
            res.redirect('/vendor/dashboard');
        }
    };

    // Update vendor profile
    updateProfile = async (req, res) => {
        try {
            const vendor = req.vendor;
            const {
                businessName,
                ownerName,
                phone,
                businessType,
                storeDescription,
                street,
                landmark,
                city,
                state,
                pincode,
                gstNumber,
                panNumber
            } = req.body;

            // Update vendor details
            vendor.businessName = businessName;
            vendor.ownerName = ownerName;
            vendor.phone = phone;
            vendor.businessType = businessType;
            vendor.storeDescription = storeDescription;
            vendor.address = {
                street,
                landmark,
                city,
                state,
                pincode: parseInt(pincode),
                country: vendor.address.country || 'India'
            };
            vendor.gstNumber = gstNumber;
            vendor.panNumber = panNumber;

            await vendor.save();

            req.flash('success_msg', 'Profile updated successfully');
            res.redirect('/vendor/profile');

        } catch (error) {
            console.error('Update profile error:', error);
            req.flash('error_msg', 'Error updating profile');
            res.redirect('/vendor/profile');
        }
    };

    // Vendor settings
    settings = async (req, res) => {
        try {
            const vendor = req.vendor;

            res.render('Vendor/settings', {
                title: 'Vendor Settings',
                vendor,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Settings error:', error);
            req.flash('error_msg', 'Error loading settings');
            res.redirect('/vendor/dashboard');
        }
    };

    // Update vendor settings
    updateSettings = async (req, res) => {
        try {
            const vendor = req.vendor;
            const {
                autoAcceptOrders,
                allowCOD,
                processingTime,
                returnPolicy,
                shippingPolicy
            } = req.body;

            // Update vendor settings
            vendor.settings = {
                autoAcceptOrders: autoAcceptOrders === 'on',
                allowCOD: allowCOD === 'on',
                processingTime: parseInt(processingTime) || 1,
                returnPolicy,
                shippingPolicy
            };

            await vendor.save();

            req.flash('success_msg', 'Settings updated successfully');
            res.redirect('/vendor/settings');

        } catch (error) {
            console.error('Update settings error:', error);
            req.flash('error_msg', 'Error updating settings');
            res.redirect('/vendor/settings');
        }
    };

    // Verification status
    verification = async (req, res) => {
        try {
            const vendor = req.vendor;

            res.render('Vendor/verification', {
                title: 'Account Verification',
                vendor,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Verification error:', error);
            req.flash('error_msg', 'Error loading verification page');
            res.redirect('/vendor/dashboard');
        }
    };

    // Analytics page
    analytics = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { period = '30' } = req.query; // days

            // Get analytics data
            const analyticsData = await this.getAnalyticsData(vendor._id, parseInt(period));

            res.render('Vendor/analytics', {
                title: 'Analytics',
                vendor,
                analyticsData,
                period,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Analytics error:', error);
            req.flash('error_msg', 'Error loading analytics');
            res.redirect('/vendor/dashboard');
        }
    };

    // Get analytics data
    getAnalyticsData = async (vendorId, days = 30) => {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Product analytics
            const productAnalytics = await Product.aggregate([
                { $match: { vendor: new mongoose.Types.ObjectId(vendorId) } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        averageRating: { $avg: '$ratings' },
                        totalViews: { $sum: '$views' }, // Add views field to product model
                        topCategory: { $first: '$category' }
                    }
                }
            ]);

            // TODO: Add more analytics when order and review models are enhanced
            return {
                products: productAnalytics[0] || {
                    totalProducts: 0,
                    averageRating: 0,
                    totalViews: 0
                },
                sales: {
                    totalSales: 0,
                    revenue: 0,
                    orders: []
                },
                traffic: {
                    views: 0,
                    uniqueVisitors: 0,
                    bounceRate: 0
                }
            };

        } catch (error) {
            console.error('Error getting analytics data:', error);
            return {
                products: { totalProducts: 0, averageRating: 0, totalViews: 0 },
                sales: { totalSales: 0, revenue: 0, orders: [] },
                traffic: { views: 0, uniqueVisitors: 0, bounceRate: 0 }
            };
        }
    };

    // Bank details management
    bankDetails = async (req, res) => {
        try {
            const vendor = req.vendor;

            res.render('Vendor/bank-details', {
                title: 'Bank Details',
                vendor,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Bank details error:', error);
            req.flash('error_msg', 'Error loading bank details');
            res.redirect('/vendor/dashboard');
        }
    };

    // Update bank details
    updateBankDetails = async (req, res) => {
        try {
            const vendor = req.vendor;
            const {
                accountHolderName,
                accountNumber,
                bankName,
                ifscCode,
                branchName
            } = req.body;

            // Update bank details
            vendor.bankDetails = {
                accountHolderName,
                accountNumber,
                bankName,
                ifscCode: ifscCode.toUpperCase(),
                branchName
            };

            await vendor.save();

            req.flash('success_msg', 'Bank details updated successfully');
            res.redirect('/vendor/bank-details');

        } catch (error) {
            console.error('Update bank details error:', error);
            req.flash('error_msg', 'Error updating bank details');
            res.redirect('/vendor/bank-details');
        }
    };

}

module.exports = new VendorDashboardController();