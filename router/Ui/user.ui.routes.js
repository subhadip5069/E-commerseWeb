const express = require('express');
const router = express.Router();

const userUiController = require('../../controller/ui/user.ui.controller');
const {authMiddleware} = require('../../middleware/Auth');
const { Subcategory } = require('../../model/category');

router.get('/',authMiddleware, userUiController.index);
router.get('/login',userUiController.login)
router.get('/signup',userUiController.signup)
router.get('/about', authMiddleware,userUiController.about)
router.get('/contactus',authMiddleware,userUiController.contactUs)
router.get('/cart',authMiddleware,userUiController.cart)
router.get('/product/:id',authMiddleware,userUiController.product)
router.get('/products',authMiddleware,userUiController.products)
router.get('/productdetails/:id',authMiddleware,userUiController.productDetails)
router.get('/bill',authMiddleware,userUiController.bill)
router.get('/history',authMiddleware,userUiController.Orderhistory)
router.get('/profile',authMiddleware,userUiController.profile)
router.get('/orderdetails/:id',authMiddleware,userUiController.orderDetails)
router.get('/carts',authMiddleware,userUiController.carts)
router.get('/filter',authMiddleware,userUiController.filterProducts)
router.get('/api/subcategories',authMiddleware, async (req, res) => {
    try {
      const { categoryId } = req.query;
      if (!categoryId) return res.json([]);
  
      const subcategories = await Subcategory.find({ category: categoryId });
      res.json(subcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = router;