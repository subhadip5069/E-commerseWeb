const express = require('express');
const app = express.Router();


app.use('/',require('./admin.ui.routes'))
app.use('/product',require('./product.ui.routes'))
app.use('/category',require('./categories.ui.routes'))
app.use('/banner',require('./banner.ui.routes'))
app.use('/about',require('./about.ui.routes'))
app.use('/subcategory',require('./subcategory.ui.routes'))
app.use('/purchase',require('./purchase.ui.routes'))
app.use('/poster',require('./posters.ui.routes'))
app.use('/user',require('./users.ui.routes'))
app.use('/contact',require('./contact.js'))
app.use('/booking',require('./bookings.ui.routes'))
app.use('/auth',require('./auth.routes'))
app.use('/vendors',require('./vendor.routes'))




module.exports = app