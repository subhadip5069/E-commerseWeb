const Settings = require('../model/settings');
const Stats = require('../model/stats');

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
                // Fetch settings and stats if not already provided
                if (!locals.settings) {
                    locals.settings = await Settings.getAllSettings();
                }
                
                if (!locals.stats) {
                    locals.stats = await Stats.find({ isActive: true }).sort({ sortOrder: 1 });
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
                // Fallback to original render if injection fails
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
        // Check if settings exist
        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            console.log('Initializing default settings...');
            await Settings.initializeDefaultSettings();
            console.log('Default settings initialized successfully');
        }

        // Check if stats exist
        const statsCount = await Stats.countDocuments();
        if (statsCount === 0) {
            console.log('Initializing default stats...');
            await Stats.initializeDefaultStats();
            console.log('Default stats initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing defaults:', error);
    }
};

module.exports = {
    injectTemplateVars,
    initializeDefaults
};