const express = require('express');
const router = express.Router();

const userUiController = require('../../controller/ui/user.ui.controller');

router.get('/', userUiController.index);
router.get('/login',userUiController.login)
router.get('/signup',userUiController.signup)
router.get('/about',userUiController.about)
router.get('/contactus',userUiController.contactUs)
router.get('/cart',userUiController.cart)
router.get('/product',userUiController.product)
router.get('/products',userUiController.products)
router.get('/bill',userUiController.bill)
router.get('/history',userUiController.Orderhistory)
router.get('/profile',userUiController.profile)
router.get('/orderdetails',userUiController.orderDetails)

module.exports = router;