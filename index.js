const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const cookieparser = require('cookie-parser');
const flash = require('connect-flash');
const userUiRoutes = require('./router/Ui/index');
const connectDB = require('./db/db');

require('dotenv').config();



const app = express();

app.use(flash());

app.use(
    session({
      secret: "your_secret_key", // Replace with a secure key
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3600000 }, // 1-hour session
    })
  );
  // / Middleware to make flash messages available in templates
  app.use((req, res, next) => {
    res.locals.success_msg = req.session.success_msg || null;
    res.locals.error_msg = req.session.error_msg || null;
    req.session.success_msg = null;
    req.session.error_msg = null;
    next();
  });
  

connectDB();

app.use(cookieparser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// views

app.set('view engine', 'ejs');
app.set('views', 'views');

// public folder
app.use(express.static('public'));
app.use('/uploads', express.static(__dirname + '/uploads'));


// api routes

// admin routes
app.use('/admin', require('./router/Admin/index'));


// ui routes
app.use('/', userUiRoutes);



app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    console.log(`http://localhost:${process.env.PORT}`);
    console.log(process.env.MONGO_URI);
});