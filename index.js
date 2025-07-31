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
  

// Connect to database and initialize defaults
const startServer = async () => {
    try {
        console.log('Starting application initialization...');
        
        // Connect to database with timeout
        await Promise.race([
            connectDB(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database connection timeout')), 15000)
            )
        ]);
        
        // Initialize default settings and stats after DB connection (non-blocking)
        initializeDefaults().catch(error => {
            console.error('Non-critical initialization error:', error);
            console.log('Application will continue without default initialization');
        });
        
        console.log('Application core initialization completed');
    } catch (error) {
        console.error('Critical initialization error:', error);
        console.log('Attempting to start server anyway...');
        // Don't exit, let the server try to start
    }
};

// Start initialization but don't block server startup
startServer();

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


// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ui routes
app.use('/', userUiRoutes);



const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Connected' : 'Not configured');
});

// Handle server startup errors
server.on('error', (error) => {
    console.error('Server startup error:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});