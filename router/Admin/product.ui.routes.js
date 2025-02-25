const express = require('express');
const router = express.Router();

const productUiController = require('../../controller/admin/product.ui.controller');
const productupload = require('../../multer/Product.multer');

// ui
router.get('/',productUiController.productUi)
router.get('/create',productUiController.createProductUi)
router.get('/update',productUiController.updateProductUi)
// functions
router.post('/add',productupload.array('images', 10),productUiController.createProduct)
router.get('/products',productUiController.getProducts)
router.get('/get/:id',productUiController.getProductById)
router.put('/product/:id',productUiController.updateProduct)
router.delete('/product/:id',productUiController.deleteProduct)

module.exports = router