const express = require('express');
const router = express.Router();

// Import vendor route modules
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const productRoutes = require('./product.routes');

// Mount routes
router.use('/', authRoutes);
router.use('/', dashboardRoutes);
router.use('/products', productRoutes);

module.exports = router;