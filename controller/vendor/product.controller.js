const Product = require('../../model/product');
const Category = require('../../model/category');
const Subcategory = require('../../model/subcategory');
const multer = require('multer');
const path = require('path');

class VendorProductController {

    // List all vendor products
    listProducts = async (req, res) => {
        try {
            const vendor = req.vendor;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const { status, category, search } = req.query;

            // Build query
            const query = { vendor: vendor._id };

            if (status) {
                if (status === 'active') {
                    query.isActive = true;
                    query.approvalStatus = 'Approved';
                } else if (status === 'pending') {
                    query.approvalStatus = 'Pending';
                } else if (status === 'rejected') {
                    query.approvalStatus = 'Rejected';
                } else if (status === 'inactive') {
                    query.isActive = false;
                }
            }

            if (category) {
                query.category = category;
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Get products with pagination
            const products = await Product.find(query)
                .populate('category subcategory')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalProducts = await Product.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / limit);

            // Get categories for filter
            const categories = await Category.find({ isActive: true });

            res.render('Vendor/products/list', {
                title: 'My Products',
                vendor,
                products,
                categories,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                filters: { status, category, search },
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('List products error:', error);
            req.flash('error_msg', 'Error loading products');
            res.redirect('/vendor/dashboard');
        }
    };

    // Show add product form
    showAddProductForm = async (req, res) => {
        try {
            const vendor = req.vendor;

            // Check if vendor is verified
            if (vendor.verificationStatus !== 'Approved') {
                req.flash('error_msg', 'Your account must be verified to add products');
                return res.redirect('/vendor/verification');
            }

            const categories = await Category.find({ isActive: true });
            const subcategories = await Subcategory.find({ isActive: true });

            res.render('Vendor/products/add', {
                title: 'Add Product',
                vendor,
                categories,
                subcategories,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Add product form error:', error);
            req.flash('error_msg', 'Error loading add product form');
            res.redirect('/vendor/products');
        }
    };

    // Create new product
    createProduct = async (req, res) => {
        try {
            const vendor = req.vendor;

            // Check if vendor is verified
            if (vendor.verificationStatus !== 'Approved') {
                req.flash('error_msg', 'Your account must be verified to add products');
                return res.redirect('/vendor/verification');
            }

            const {
                name,
                description,
                launchingPrice,
                currentPrice,
                category,
                subcategory,
                stock,
                brand,
                model,
                color,
                size,
                weight,
                dimensions,
                material,
                warranty,
                tags,
                freeShipping,
                shippingCharge
            } = req.body;

            // Validation
            if (!name || !description || !launchingPrice || !currentPrice || !category || !stock) {
                req.flash('error_msg', 'Please fill all required fields');
                return res.redirect('/vendor/products/add');
            }

            // Handle image uploads
            const images = [];
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    images.push(`/uploads/${file.filename}`);
                });
            }

            // Create product
            const product = new Product({
                name,
                description,
                launchingPrice: parseFloat(launchingPrice),
                currentPrice: parseFloat(currentPrice),
                category,
                subcategory: subcategory || undefined,
                vendor: vendor._id,
                stock: parseInt(stock),
                images,
                specifications: {
                    brand,
                    model,
                    color,
                    size,
                    weight,
                    dimensions,
                    material,
                    warranty
                },
                shipping: {
                    freeShipping: freeShipping === 'on',
                    shippingCharge: parseFloat(shippingCharge) || 0
                },
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                approvalStatus: 'Pending' // Vendor products need approval
            });

            await product.save();

            // Update vendor product count
            await vendor.updatePerformance();

            req.flash('success_msg', 'Product added successfully and sent for approval');
            res.redirect('/vendor/products');

        } catch (error) {
            console.error('Create product error:', error);
            req.flash('error_msg', 'Error creating product');
            res.redirect('/vendor/products/add');
        }
    };

    // Show edit product form
    showEditProductForm = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { id } = req.params;

            const product = await Product.findOne({ _id: id, vendor: vendor._id })
                .populate('category subcategory');

            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect('/vendor/products');
            }

            const categories = await Category.find({ isActive: true });
            const subcategories = await Subcategory.find({ isActive: true });

            res.render('Vendor/products/edit', {
                title: 'Edit Product',
                vendor,
                product,
                categories,
                subcategories,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Edit product form error:', error);
            req.flash('error_msg', 'Error loading edit form');
            res.redirect('/vendor/products');
        }
    };

    // Update product
    updateProduct = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { id } = req.params;

            const product = await Product.findOne({ _id: id, vendor: vendor._id });

            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect('/vendor/products');
            }

            const {
                name,
                description,
                launchingPrice,
                currentPrice,
                category,
                subcategory,
                stock,
                brand,
                model,
                color,
                size,
                weight,
                dimensions,
                material,
                warranty,
                tags,
                freeShipping,
                shippingCharge,
                isActive
            } = req.body;

            // Handle new image uploads
            if (req.files && req.files.length > 0) {
                const newImages = [];
                req.files.forEach(file => {
                    newImages.push(`/uploads/${file.filename}`);
                });
                product.images = [...product.images, ...newImages];
            }

            // Update product fields
            product.name = name;
            product.description = description;
            product.launchingPrice = parseFloat(launchingPrice);
            product.currentPrice = parseFloat(currentPrice);
            product.category = category;
            product.subcategory = subcategory || undefined;
            product.stock = parseInt(stock);
            product.specifications = {
                brand,
                model,
                color,
                size,
                weight,
                dimensions,
                material,
                warranty
            };
            product.shipping = {
                freeShipping: freeShipping === 'on',
                shippingCharge: parseFloat(shippingCharge) || 0
            };
            product.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
            product.isActive = isActive === 'on';

            // If product was rejected and now being updated, set to pending again
            if (product.approvalStatus === 'Rejected') {
                product.approvalStatus = 'Pending';
                product.rejectionReason = undefined;
            }

            await product.save();

            req.flash('success_msg', 'Product updated successfully');
            res.redirect('/vendor/products');

        } catch (error) {
            console.error('Update product error:', error);
            req.flash('error_msg', 'Error updating product');
            res.redirect(`/vendor/products/edit/${req.params.id}`);
        }
    };

    // Delete product
    deleteProduct = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { id } = req.params;

            const product = await Product.findOne({ _id: id, vendor: vendor._id });

            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect('/vendor/products');
            }

            await Product.findByIdAndDelete(id);

            // Update vendor product count
            await vendor.updatePerformance();

            req.flash('success_msg', 'Product deleted successfully');
            res.redirect('/vendor/products');

        } catch (error) {
            console.error('Delete product error:', error);
            req.flash('error_msg', 'Error deleting product');
            res.redirect('/vendor/products');
        }
    };

    // Toggle product status
    toggleProductStatus = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { id } = req.params;

            const product = await Product.findOne({ _id: id, vendor: vendor._id });

            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            product.isActive = !product.isActive;
            await product.save();

            res.json({ 
                success: true, 
                message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
                isActive: product.isActive
            });

        } catch (error) {
            console.error('Toggle product status error:', error);
            res.status(500).json({ success: false, message: 'Error updating product status' });
        }
    };

    // Remove product image
    removeProductImage = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { id } = req.params;
            const { imageUrl } = req.body;

            const product = await Product.findOne({ _id: id, vendor: vendor._id });

            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // Remove image from array
            product.images = product.images.filter(img => img !== imageUrl);
            await product.save();

            res.json({ success: true, message: 'Image removed successfully' });

        } catch (error) {
            console.error('Remove image error:', error);
            res.status(500).json({ success: false, message: 'Error removing image' });
        }
    };

    // Bulk actions
    bulkAction = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { action, productIds } = req.body;

            if (!action || !productIds || !Array.isArray(productIds)) {
                req.flash('error_msg', 'Invalid bulk action request');
                return res.redirect('/vendor/products');
            }

            const query = { 
                _id: { $in: productIds }, 
                vendor: vendor._id 
            };

            let updateData = {};
            let message = '';

            switch (action) {
                case 'activate':
                    updateData = { isActive: true };
                    message = 'Products activated successfully';
                    break;
                case 'deactivate':
                    updateData = { isActive: false };
                    message = 'Products deactivated successfully';
                    break;
                case 'delete':
                    await Product.deleteMany(query);
                    await vendor.updatePerformance();
                    req.flash('success_msg', 'Products deleted successfully');
                    return res.redirect('/vendor/products');
                default:
                    req.flash('error_msg', 'Invalid action');
                    return res.redirect('/vendor/products');
            }

            await Product.updateMany(query, updateData);
            req.flash('success_msg', message);
            res.redirect('/vendor/products');

        } catch (error) {
            console.error('Bulk action error:', error);
            req.flash('error_msg', 'Error performing bulk action');
            res.redirect('/vendor/products');
        }
    };

    // View product details
    viewProduct = async (req, res) => {
        try {
            const vendor = req.vendor;
            const { id } = req.params;

            const product = await Product.findOne({ _id: id, vendor: vendor._id })
                .populate('category subcategory');

            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect('/vendor/products');
            }

            res.render('Vendor/products/view', {
                title: 'Product Details',
                vendor,
                product,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('View product error:', error);
            req.flash('error_msg', 'Error loading product details');
            res.redirect('/vendor/products');
        }
    };

}

module.exports = new VendorProductController();