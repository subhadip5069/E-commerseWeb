const Vendor = require('../../model/vendor');
const Product = require('../../model/product');
const mongoose = require('mongoose');

class AdminVendorController {

    // List all vendors
    listVendors = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const { status, verification, search } = req.query;

            // Build query
            const query = {};

            if (status) {
                if (status === 'active') {
                    query.isActive = true;
                    query.isBlocked = false;
                } else if (status === 'blocked') {
                    query.isBlocked = true;
                } else if (status === 'inactive') {
                    query.isActive = false;
                }
            }

            if (verification) {
                query.verificationStatus = verification;
            }

            if (search) {
                query.$or = [
                    { businessName: { $regex: search, $options: 'i' } },
                    { ownerName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            // Get vendors with pagination
            const vendors = await Vendor.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalVendors = await Vendor.countDocuments(query);
            const totalPages = Math.ceil(totalVendors / limit);

            // Get statistics
            const stats = await this.getVendorStats();

            res.render('Admin/vendors/list', {
                title: 'Vendor Management',
                vendors,
                stats,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalVendors,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                filters: { status, verification, search },
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('List vendors error:', error);
            req.flash('error_msg', 'Error loading vendors');
            res.redirect('/admin/dashboard');
        }
    };

    // Get vendor statistics
    getVendorStats = async () => {
        try {
            const totalVendors = await Vendor.countDocuments();
            const activeVendors = await Vendor.countDocuments({ isActive: true, isBlocked: false });
            const pendingVerification = await Vendor.countDocuments({ verificationStatus: 'Pending' });
            const approvedVendors = await Vendor.countDocuments({ verificationStatus: 'Approved' });
            const blockedVendors = await Vendor.countDocuments({ isBlocked: true });

            return {
                totalVendors,
                activeVendors,
                pendingVerification,
                approvedVendors,
                blockedVendors
            };
        } catch (error) {
            console.error('Error getting vendor stats:', error);
            return {
                totalVendors: 0,
                activeVendors: 0,
                pendingVerification: 0,
                approvedVendors: 0,
                blockedVendors: 0
            };
        }
    };

    // View vendor details
    viewVendor = async (req, res) => {
        try {
            const { id } = req.params;

            const vendor = await Vendor.findById(id);

            if (!vendor) {
                req.flash('error_msg', 'Vendor not found');
                return res.redirect('/admin/vendors');
            }

            // Get vendor's products
            const products = await Product.find({ vendor: id })
                .populate('category subcategory')
                .sort({ createdAt: -1 })
                .limit(10);

            // Get vendor statistics
            const vendorStats = await this.getVendorDetailStats(id);

            res.render('Admin/vendors/view', {
                title: 'Vendor Details',
                vendor,
                products,
                vendorStats,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('View vendor error:', error);
            req.flash('error_msg', 'Error loading vendor details');
            res.redirect('/admin/vendors');
        }
    };

    // Get vendor detail statistics
    getVendorDetailStats = async (vendorId) => {
        try {
            const totalProducts = await Product.countDocuments({ vendor: vendorId });
            const activeProducts = await Product.countDocuments({ vendor: vendorId, isActive: true, approvalStatus: 'Approved' });
            const pendingProducts = await Product.countDocuments({ vendor: vendorId, approvalStatus: 'Pending' });

            // TODO: Add order and revenue stats when order model is updated
            return {
                totalProducts,
                activeProducts,
                pendingProducts,
                totalOrders: 0,
                totalRevenue: 0
            };
        } catch (error) {
            console.error('Error getting vendor detail stats:', error);
            return {
                totalProducts: 0,
                activeProducts: 0,
                pendingProducts: 0,
                totalOrders: 0,
                totalRevenue: 0
            };
        }
    };

    // Approve vendor
    approveVendor = async (req, res) => {
        try {
            const { id } = req.params;

            const vendor = await Vendor.findById(id);

            if (!vendor) {
                req.flash('error_msg', 'Vendor not found');
                return res.redirect('/admin/vendors');
            }

            vendor.verificationStatus = 'Approved';
            vendor.verificationNotes = 'Approved by admin';
            await vendor.save();

            req.flash('success_msg', `Vendor ${vendor.businessName} has been approved`);
            res.redirect(`/admin/vendors/view/${id}`);

        } catch (error) {
            console.error('Approve vendor error:', error);
            req.flash('error_msg', 'Error approving vendor');
            res.redirect('/admin/vendors');
        }
    };

    // Reject vendor
    rejectVendor = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const vendor = await Vendor.findById(id);

            if (!vendor) {
                req.flash('error_msg', 'Vendor not found');
                return res.redirect('/admin/vendors');
            }

            vendor.verificationStatus = 'Rejected';
            vendor.verificationNotes = reason || 'Rejected by admin';
            await vendor.save();

            req.flash('success_msg', `Vendor ${vendor.businessName} has been rejected`);
            res.redirect(`/admin/vendors/view/${id}`);

        } catch (error) {
            console.error('Reject vendor error:', error);
            req.flash('error_msg', 'Error rejecting vendor');
            res.redirect('/admin/vendors');
        }
    };

    // Block vendor
    blockVendor = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const vendor = await Vendor.findById(id);

            if (!vendor) {
                req.flash('error_msg', 'Vendor not found');
                return res.redirect('/admin/vendors');
            }

            vendor.isBlocked = true;
            vendor.blockReason = reason || 'Blocked by admin';
            await vendor.save();

            req.flash('success_msg', `Vendor ${vendor.businessName} has been blocked`);
            res.redirect(`/admin/vendors/view/${id}`);

        } catch (error) {
            console.error('Block vendor error:', error);
            req.flash('error_msg', 'Error blocking vendor');
            res.redirect('/admin/vendors');
        }
    };

    // Unblock vendor
    unblockVendor = async (req, res) => {
        try {
            const { id } = req.params;

            const vendor = await Vendor.findById(id);

            if (!vendor) {
                req.flash('error_msg', 'Vendor not found');
                return res.redirect('/admin/vendors');
            }

            vendor.isBlocked = false;
            vendor.blockReason = '';
            await vendor.save();

            req.flash('success_msg', `Vendor ${vendor.businessName} has been unblocked`);
            res.redirect(`/admin/vendors/view/${id}`);

        } catch (error) {
            console.error('Unblock vendor error:', error);
            req.flash('error_msg', 'Error unblocking vendor');
            res.redirect('/admin/vendors');
        }
    };

    // Update vendor commission
    updateCommission = async (req, res) => {
        try {
            const { id } = req.params;
            const { commissionRate } = req.body;

            const vendor = await Vendor.findById(id);

            if (!vendor) {
                req.flash('error_msg', 'Vendor not found');
                return res.redirect('/admin/vendors');
            }

            vendor.commissionRate = parseFloat(commissionRate);
            await vendor.save();

            req.flash('success_msg', `Commission rate updated to ${commissionRate}% for ${vendor.businessName}`);
            res.redirect(`/admin/vendors/view/${id}`);

        } catch (error) {
            console.error('Update commission error:', error);
            req.flash('error_msg', 'Error updating commission rate');
            res.redirect('/admin/vendors');
        }
    };

    // Vendor products management
    vendorProducts = async (req, res) => {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const { status } = req.query;

            const vendor = await Vendor.findById(id);

            if (!vendor) {
                req.flash('error_msg', 'Vendor not found');
                return res.redirect('/admin/vendors');
            }

            // Build query
            const query = { vendor: id };

            if (status) {
                if (status === 'pending') {
                    query.approvalStatus = 'Pending';
                } else if (status === 'approved') {
                    query.approvalStatus = 'Approved';
                } else if (status === 'rejected') {
                    query.approvalStatus = 'Rejected';
                }
            }

            // Get products with pagination
            const products = await Product.find(query)
                .populate('category subcategory')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalProducts = await Product.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / limit);

            res.render('Admin/vendors/products', {
                title: `${vendor.businessName} - Products`,
                vendor,
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                filters: { status },
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Vendor products error:', error);
            req.flash('error_msg', 'Error loading vendor products');
            res.redirect('/admin/vendors');
        }
    };

    // Approve vendor product
    approveProduct = async (req, res) => {
        try {
            const { vendorId, productId } = req.params;

            const product = await Product.findOne({ _id: productId, vendor: vendorId });

            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect(`/admin/vendors/${vendorId}/products`);
            }

            product.approvalStatus = 'Approved';
            product.rejectionReason = undefined;
            await product.save();

            req.flash('success_msg', `Product "${product.name}" has been approved`);
            res.redirect(`/admin/vendors/${vendorId}/products`);

        } catch (error) {
            console.error('Approve product error:', error);
            req.flash('error_msg', 'Error approving product');
            res.redirect(`/admin/vendors/${req.params.vendorId}/products`);
        }
    };

    // Reject vendor product
    rejectProduct = async (req, res) => {
        try {
            const { vendorId, productId } = req.params;
            const { reason } = req.body;

            const product = await Product.findOne({ _id: productId, vendor: vendorId });

            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect(`/admin/vendors/${vendorId}/products`);
            }

            product.approvalStatus = 'Rejected';
            product.rejectionReason = reason || 'Rejected by admin';
            await product.save();

            req.flash('success_msg', `Product "${product.name}" has been rejected`);
            res.redirect(`/admin/vendors/${vendorId}/products`);

        } catch (error) {
            console.error('Reject product error:', error);
            req.flash('error_msg', 'Error rejecting product');
            res.redirect(`/admin/vendors/${req.params.vendorId}/products`);
        }
    };

    // Bulk actions for vendors
    bulkAction = async (req, res) => {
        try {
            const { action, vendorIds } = req.body;

            if (!action || !vendorIds || !Array.isArray(vendorIds)) {
                req.flash('error_msg', 'Invalid bulk action request');
                return res.redirect('/admin/vendors');
            }

            const query = { _id: { $in: vendorIds } };
            let updateData = {};
            let message = '';

            switch (action) {
                case 'approve':
                    updateData = { verificationStatus: 'Approved', verificationNotes: 'Bulk approved by admin' };
                    message = 'Vendors approved successfully';
                    break;
                case 'block':
                    updateData = { isBlocked: true, blockReason: 'Bulk blocked by admin' };
                    message = 'Vendors blocked successfully';
                    break;
                case 'unblock':
                    updateData = { isBlocked: false, blockReason: '' };
                    message = 'Vendors unblocked successfully';
                    break;
                default:
                    req.flash('error_msg', 'Invalid action');
                    return res.redirect('/admin/vendors');
            }

            await Vendor.updateMany(query, updateData);
            req.flash('success_msg', message);
            res.redirect('/admin/vendors');

        } catch (error) {
            console.error('Bulk action error:', error);
            req.flash('error_msg', 'Error performing bulk action');
            res.redirect('/admin/vendors');
        }
    };

}

module.exports = new AdminVendorController();