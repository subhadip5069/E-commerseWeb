const express = require('express');
const router = express.Router();

const productUiController = require('../../controller/admin/product.ui.controller');
const productupload = require('../../multer/Product.multer');
const { AdminauthMiddleware } = require('../../middleware/Auth');

// ui
router.get('/',AdminauthMiddleware,productUiController.productUi)
router.get('/create',AdminauthMiddleware,productUiController.createProductUi)
router.get('/add',AdminauthMiddleware,productUiController.createProductUi) // Alternative route for add form
router.get('/update',AdminauthMiddleware,productUiController.updateProductUi)
// functions
router.post('/add',AdminauthMiddleware,productupload.array('images', 10),productUiController.createProduct)
router.get('/products',AdminauthMiddleware,productUiController.getProducts)
router.get('/get/:id',AdminauthMiddleware,productUiController.getProductById)
router.post('/product/:id',AdminauthMiddleware,productUiController.updateProduct)
router.get('/product/delete/:id',AdminauthMiddleware,productUiController.deleteProduct)

module.exports = router