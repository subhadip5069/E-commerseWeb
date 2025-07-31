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