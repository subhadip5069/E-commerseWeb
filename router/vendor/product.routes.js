const express = require('express');
const router = express.Router();
const vendorProductController = require('../../controller/vendor/product.controller');
const { vendorAuthMiddleware, verifiedVendorMiddleware } = require('../../middleware/vendorAuth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Apply vendor authentication to all routes
router.use(vendorAuthMiddleware);

// Product listing and management
router.get('/', vendorProductController.listProducts);
router.get('/list', vendorProductController.listProducts);

// Add product routes
router.get('/add', verifiedVendorMiddleware, vendorProductController.showAddProductForm);
router.post('/add', verifiedVendorMiddleware, upload.array('images', 10), vendorProductController.createProduct);

// Edit product routes
router.get('/edit/:id', vendorProductController.showEditProductForm);
router.post('/edit/:id', upload.array('images', 10), vendorProductController.updateProduct);

// View product details
router.get('/view/:id', vendorProductController.viewProduct);

// Delete product
router.post('/delete/:id', vendorProductController.deleteProduct);
router.delete('/delete/:id', vendorProductController.deleteProduct);

// Toggle product status (AJAX)
router.post('/toggle-status/:id', vendorProductController.toggleProductStatus);

// Remove product image (AJAX)
router.post('/remove-image/:id', vendorProductController.removeProductImage);

// Bulk actions
router.post('/bulk-action', vendorProductController.bulkAction);

module.exports = router;