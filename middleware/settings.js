const Settings = require('../model/settings');
const Stats = require('../model/stats');
const mongoose = require('mongoose');

// Helper function to check if database is connected
const isDatabaseConnected = () => {
    return mongoose.connection.readyState === 1;
};

/**
 * Middleware to inject common template variables (settings, stats) into all views
 */
const injectTemplateVars = async (req, res, next) => {
    try {
        // Store original render function
        const originalRender = res.render;

        // Override render function to inject common variables
        res.render = async function(view, locals = {}, callback) {
            try {
                // Fetch settings and stats if not already provided with timeout
                if (!locals.settings) {
                    if (!isDatabaseConnected()) {
                        console.log('Database not connected, using empty settings');
                        locals.settings = {};
                    } else {
                        try {
                            locals.settings = await Promise.race([
                                Settings.getAllSettings(),
                                new Promise((_, reject) => 
                                    setTimeout(() => reject(new Error('Settings timeout')), 3000)
                                )
                            ]);
                        } catch (settingsError) {
                            console.error('Settings fetch error:', settingsError.message);
                            locals.settings = {}; // Fallback to empty settings
                        }
                    }
                }
                
                if (!locals.stats) {
                    if (!isDatabaseConnected()) {
                        console.log('Database not connected, using empty stats');
                        locals.stats = [];
                    } else {
                        try {
                            locals.stats = await Promise.race([
                                Stats.find({ isActive: true }).sort({ sortOrder: 1 }),
                                new Promise((_, reject) => 
                                    setTimeout(() => reject(new Error('Stats timeout')), 3000)
                                )
                            ]);
                        } catch (statsError) {
                            console.error('Stats fetch error:', statsError.message);
                            locals.stats = []; // Fallback to empty stats
                        }
                    }
                }

                // Add current year for copyright
                locals.currentYear = new Date().getFullYear();

                // Add request information
                locals.currentUrl = req.url;
                locals.currentPath = req.path;

                // Call original render with enhanced locals
                return originalRender.call(this, view, locals, callback);
            } catch (error) {
                console.error('Error injecting template variables:', error);
                // Provide fallback values and continue
                locals.settings = locals.settings || {};
                locals.stats = locals.stats || [];
                locals.currentYear = new Date().getFullYear();
                locals.currentUrl = req.url;
                locals.currentPath = req.path;
                
                return originalRender.call(this, view, locals, callback);
            }
        };

        next();
    } catch (error) {
        console.error('Settings middleware error:', error);
        next(); // Continue even if middleware fails
    }
};

/**
 * Initialize default settings and stats if they don't exist
 */
const initializeDefaults = async () => {
    try {
        console.log('Initializing default settings...');
        
        // Check if settings exist with timeout
        const settingsCount = await Promise.race([
            Settings.countDocuments(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Settings count timeout')), 5000))
        ]);
        
        if (settingsCount === 0) {
            console.log('Creating default settings...');
            await Promise.race([
                Settings.initializeDefaultSettings(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Settings init timeout')), 10000))
            ]);
            console.log('Default settings initialized successfully');
        } else {
            console.log(`Found ${settingsCount} existing settings`);
        }

        // Check if stats exist with timeout
        const statsCount = await Promise.race([
            Stats.countDocuments(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Stats count timeout')), 5000))
        ]);
        
        if (statsCount === 0) {
            console.log('Creating default stats...');
            await Promise.race([
                Stats.initializeDefaultStats(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Stats init timeout')), 10000))
            ]);
            console.log('Default stats initialized successfully');
        } else {
            console.log(`Found ${statsCount} existing stats`);
        }
        
        console.log('Initialization completed successfully');
    } catch (error) {
        console.error('Error initializing defaults:', error);
        // Don't throw the error, just log it and continue
        console.log('Continuing with application startup despite initialization errors');
    }
};

module.exports = {
    injectTemplateVars,
    initializeDefaults
};