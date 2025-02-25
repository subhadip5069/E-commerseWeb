const express = require('express');
const router = express.Router();

const productUiController = require('../../controller/admin/product.ui.controller');
const productupload = require('../../multer/Product.multer');
const { AdminauthMiddleware } = require('../../middleware/Auth');

// ui
router.get('/',AdminauthMiddleware,productUiController.productUi)
router.get('/create',AdminauthMiddleware,productUiController.createProductUi)
router.get('/update',AdminauthMiddleware,productUiController.updateProductUi)
// functions
router.post('/add',AdminauthMiddleware,productupload.array('images', 10),productUiController.createProduct)
router.get('/products',AdminauthMiddleware,productUiController.getProducts)
router.get('/get/:id',AdminauthMiddleware,productUiController.getProductById)
router.put('/product/:id',AdminauthMiddleware,productUiController.updateProduct)
router.delete('/product/:id',AdminauthMiddleware,productUiController.deleteProduct)

module.exports = router