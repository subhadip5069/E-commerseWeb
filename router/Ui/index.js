const express = require('express');
const router = express.Router();

const useruiRoutes = require('./user.ui.routes');
const authRoutes = require('./auth.routes');


router.use('/', useruiRoutes);
router.use('/', authRoutes);
router.use('/contactus',require('./contactUS.routes'))
router.use('/cart',require('./cart.ui.routes'))
router.use('/address',require('./address.ui.router'))
router.use('/checkout',require('./checkout.ui.routes'))
router.use('/payment',require('./payment.ui.routes'))
router.use('/bill',require('./bill.routes'))
router.use('/scearch',require('./filter.product.routes'))










module.exports = router;