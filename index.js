const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const cookieparser = require('cookie-parser');
const flash = require('connect-flash');
const userUiRoutes = require('./router/Ui/index');
const connectDB = require('./db/db');
const { injectTemplateVars, initializeDefaults } = require('./middleware/settings');

require('dotenv').config();



const app = express();

app.use(
    session({
      secret: process.env.SESSION_SECRET || "fallback_secret_change_in_production",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 3600000,
        secure: process.env.COOKIE_SECURE === 'true',
        httpOnly: true,
        sameSite: 'strict'
      },
    })
  );

// Initialize flash middleware after session
app.use(flash());

// Middleware to make flash messages available in templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.info_msg = req.flash('info_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  next();
});
  

connectDB();

// Initialize default settings and stats
initializeDefaults();

app.use(cookieparser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// views

app.set('view engine', 'ejs');
app.set('views', 'views');

// public folder
app.use(express.static('public'));
app.use('/uploads', express.static(__dirname + '/uploads'));

// Inject common template variables
app.use(injectTemplateVars);


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