const express = require('express');
const router = express.Router();

// Panel overview page showing all available features
router.get('/', (req, res) => {
    res.render('panel/index', {
        title: 'E-Commerce Marketplace Panel',
        features: {
            admin: {
                title: 'Admin Panel',
                description: 'Complete administrative control',
                url: '/admin',
                features: [
                    'Dashboard with analytics',
                    'Product management',
                    'Category & subcategory management',
                    'Vendor management & approval',
                    'Order management',
                    'User management',
                    'Content management (banners, posters, about)',
                    'Settings & configuration'
                ]
            },
            vendor: {
                title: 'Vendor Panel',
                description: 'Multi-vendor marketplace for sellers',
                url: '/vendor',
                features: [
                    'Vendor registration & verification',
                    'Vendor dashboard with analytics',
                    'Product listing & management',
                    'Order tracking & fulfillment',
                    'Bank details & commission tracking',
                    'Performance analytics',
                    'Customer review responses',
                    'Business settings management'
                ]
            },
            customer: {
                title: 'Customer Store',
                description: 'Shopping experience for customers',
                url: '/',
                features: [
                    'Product browsing & search',
                    'Advanced filtering & sorting',
                    'Multi-address management',
                    'Shopping cart & checkout',
                    'Payment integration (Razorpay)',
                    'Order tracking',
                    'Product reviews & ratings',
                    'Vendor store browsing'
                ]
            }
        },
        quickLinks: {
            admin: [
                { name: 'Admin Login', url: '/admin' },
                { name: 'Product Management', url: '/admin/product' },
                { name: 'Vendor Management', url: '/admin/vendors' },
                { name: 'Category Management', url: '/admin/category' },
                { name: 'Order Management', url: '/admin/purchase' },
                { name: 'User Management', url: '/admin/user' }
            ],
            vendor: [
                { name: 'Vendor Login', url: '/vendor/login' },
                { name: 'Vendor Registration', url: '/vendor/register' },
                { name: 'Vendor Dashboard', url: '/vendor/dashboard' },
                { name: 'Add Product', url: '/vendor/products/add' },
                { name: 'My Products', url: '/vendor/products' },
                { name: 'Analytics', url: '/vendor/analytics' }
            ],
            customer: [
                { name: 'Home Page', url: '/' },
                { name: 'Search Products', url: '/search' },
                { name: 'Customer Login', url: '/login' },
                { name: 'Customer Register', url: '/register' },
                { name: 'Shopping Cart', url: '/cart' },
                { name: 'My Orders', url: '/orders' }
            ]
        },
        apis: {
            search: [
                { method: 'GET', endpoint: '/api/search', description: 'Advanced product search with filters' },
                { method: 'GET', endpoint: '/api/search/suggestions', description: 'Search autocomplete suggestions' },
                { method: 'GET', endpoint: '/api/categories', description: 'Get all categories' },
                { method: 'GET', endpoint: '/api/vendors', description: 'Get all approved vendors' }
            ],
            products: [
                { method: 'GET', endpoint: '/api/products', description: 'Get all products with pagination' },
                { method: 'GET', endpoint: '/api/products/:id', description: 'Get product details' },
                { method: 'GET', endpoint: '/api/products/category/:id', description: 'Get products by category' },
                { method: 'GET', endpoint: '/api/products/vendor/:id', description: 'Get products by vendor' }
            ],
            vendor: [
                { method: 'POST', endpoint: '/vendor/register', description: 'Vendor registration' },
                { method: 'POST', endpoint: '/vendor/login', description: 'Vendor authentication' },
                { method: 'GET', endpoint: '/vendor/dashboard', description: 'Vendor dashboard data' },
                { method: 'POST', endpoint: '/vendor/products/add', description: 'Add new product' }
            ],
            admin: [
                { method: 'GET', endpoint: '/admin/vendors', description: 'Get all vendors with filters' },
                { method: 'POST', endpoint: '/admin/vendors/approve/:id', description: 'Approve vendor' },
                { method: 'POST', endpoint: '/admin/vendors/block/:id', description: 'Block vendor' },
                { method: 'GET', endpoint: '/admin/vendors/:id/products', description: 'Get vendor products' }
            ]
        }
    });
});

// API documentation route
router.get('/api-docs', (req, res) => {
    res.render('panel/api-docs', {
        title: 'API Documentation',
        endpoints: {
            authentication: [
                {
                    method: 'POST',
                    endpoint: '/auth/login',
                    description: 'User login',
                    body: { email: 'string', password: 'string' },
                    response: { success: 'boolean', token: 'string', user: 'object' }
                },
                {
                    method: 'POST',
                    endpoint: '/vendor/login',
                    description: 'Vendor login',
                    body: { email: 'string', password: 'string' },
                    response: { success: 'boolean', token: 'string', vendor: 'object' }
                }
            ],
            products: [
                {
                    method: 'GET',
                    endpoint: '/api/products',
                    description: 'Get products with pagination and filters',
                    query: { page: 'number', limit: 'number', category: 'string', search: 'string' },
                    response: { products: 'array', pagination: 'object', totalCount: 'number' }
                },
                {
                    method: 'GET',
                    endpoint: '/api/search',
                    description: 'Advanced product search',
                    query: { q: 'string', minPrice: 'number', maxPrice: 'number', rating: 'number' },
                    response: { products: 'array', facets: 'object', priceRange: 'object' }
                }
            ],
            vendor: [
                {
                    method: 'POST',
                    endpoint: '/vendor/products/add',
                    description: 'Add new product (requires vendor auth)',
                    headers: { 'Cookie': 'vendorToken=<jwt_token>' },
                    body: { name: 'string', description: 'string', price: 'number', category: 'string' },
                    response: { success: 'boolean', product: 'object' }
                }
            ]
        }
    });
});

// Demo data route
router.get('/demo', (req, res) => {
    res.render('panel/demo', {
        title: 'Demo Data & Testing',
        demoData: {
            adminCredentials: {
                email: 'admin@example.com',
                password: 'admin123',
                note: 'Default admin account for testing'
            },
            vendorCredentials: {
                email: 'vendor@example.com',
                password: 'vendor123',
                note: 'Sample vendor account for testing'
            },
            customerCredentials: {
                email: 'customer@example.com',
                password: 'customer123',
                note: 'Sample customer account for testing'
            },
            testCards: {
                razorpay: {
                    cardNumber: '4111111111111111',
                    expiry: '12/25',
                    cvv: '123',
                    note: 'Test card for Razorpay payments'
                }
            },
            sampleProducts: [
                { name: 'Smartphone', category: 'Electronics', price: '₹15,000' },
                { name: 'Laptop', category: 'Electronics', price: '₹45,000' },
                { name: 'T-Shirt', category: 'Fashion', price: '₹500' },
                { name: 'Book', category: 'Books', price: '₹300' }
            ]
        }
    });
});

// System status route
router.get('/status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const Product = require('../model/product');
        const Vendor = require('../model/vendor');
        const User = require('../model/user');
        const Order = require('../model/order');

        // Get system statistics
        const [
            totalProducts,
            totalVendors,
            totalUsers,
            totalOrders,
            activeVendors,
            pendingVendors
        ] = await Promise.all([
            Product.countDocuments(),
            Vendor.countDocuments(),
            User.countDocuments(),
            Order.countDocuments(),
            Vendor.countDocuments({ verificationStatus: 'Approved', isActive: true }),
            Vendor.countDocuments({ verificationStatus: 'Pending' })
        ]);

        const systemStatus = {
            database: {
                status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
                host: mongoose.connection.host,
                name: mongoose.connection.name
            },
            statistics: {
                totalProducts,
                totalVendors,
                totalUsers,
                totalOrders,
                activeVendors,
                pendingVendors
            },
            features: {
                multiVendor: true,
                paymentGateway: true,
                advancedSearch: true,
                reviewSystem: true,
                orderManagement: true,
                adminPanel: true
            }
        };

        res.render('panel/status', {
            title: 'System Status',
            systemStatus,
            uptime: process.uptime(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development'
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.render('panel/status', {
            title: 'System Status',
            systemStatus: { error: 'Unable to fetch system status' },
            uptime: process.uptime(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development'
        });
    }
});

module.exports = router;