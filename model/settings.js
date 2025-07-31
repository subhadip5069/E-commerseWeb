const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'site_name',
            'site_logo',
            'site_description',
            'contact_email',
            'contact_phone',
            'contact_address',
            'facebook_url',
            'twitter_url',
            'instagram_url',
            'youtube_url',
            'linkedin_url',
            'amazon_url',
            'business_hours',
            'footer_text',
            'privacy_policy_url',
            'terms_conditions_url',
            'refund_policy_url',
            'shipping_policy_url',
            'meta_title',
            'meta_description',
            'meta_keywords',
            'google_analytics_id',
            'maintenance_mode'
        ]
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'url', 'email', 'phone', 'number', 'boolean', 'json'],
        default: 'text'
    },
    category: {
        type: String,
        enum: ['general', 'contact', 'social', 'seo', 'legal', 'system'],
        default: 'general'
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEditable: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better performance
// Note: key field already has unique: true which creates an index
settingsSchema.index({ category: 1, isActive: 1 });

// Method to get settings by category
settingsSchema.statics.getByCategory = async function(category) {
    const settings = await this.find({ 
        category: category, 
        isActive: true 
    }).sort({ sortOrder: 1 });
    
    const result = {};
    settings.forEach(setting => {
        result[setting.key] = setting.value;
    });
    
    return result;
};

// Method to get all active settings as key-value pairs
settingsSchema.statics.getAllSettings = async function() {
    const settings = await this.find({ isActive: true });
    
    const result = {};
    settings.forEach(setting => {
        result[setting.key] = setting.value;
    });
    
    return result;
};

// Method to update a setting
settingsSchema.statics.updateSetting = async function(key, value, updatedBy = null) {
    return await this.findOneAndUpdate(
        { key },
        { 
            value, 
            updatedBy,
            updatedAt: new Date()
        },
        { upsert: true, new: true }
    );
};

// Method to initialize default settings
settingsSchema.statics.initializeDefaultSettings = async function() {
    const defaultSettings = [
        // General Settings
        {
            key: 'site_name',
            value: 'E-Commerce Store',
            type: 'text',
            category: 'general',
            description: 'Website name displayed in header and title'
        },
        {
            key: 'site_logo',
            value: '/images/logo.svg',
            type: 'url',
            category: 'general',
            description: 'Website logo path'
        },
        {
            key: 'site_description',
            value: 'Your one-stop shop for quality products',
            type: 'text',
            category: 'general',
            description: 'Website description for meta tags'
        },
        
        // Contact Settings
        {
            key: 'contact_email',
            value: 'contact@ecommerce.com',
            type: 'email',
            category: 'contact',
            description: 'Primary contact email'
        },
        {
            key: 'contact_phone',
            value: '+1 (555) 123-4567',
            type: 'phone',
            category: 'contact',
            description: 'Primary contact phone number'
        },
        {
            key: 'contact_address',
            value: '123 Business Street, City, State 12345',
            type: 'text',
            category: 'contact',
            description: 'Business address'
        },
        {
            key: 'business_hours',
            value: 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM, Sun: Closed',
            type: 'text',
            category: 'contact',
            description: 'Business operating hours'
        },
        
        // Social Media Settings
        {
            key: 'facebook_url',
            value: 'https://facebook.com/yourstore',
            type: 'url',
            category: 'social',
            description: 'Facebook page URL'
        },
        {
            key: 'twitter_url',
            value: 'https://twitter.com/yourstore',
            type: 'url',
            category: 'social',
            description: 'Twitter profile URL'
        },
        {
            key: 'instagram_url',
            value: 'https://instagram.com/yourstore',
            type: 'url',
            category: 'social',
            description: 'Instagram profile URL'
        },
        {
            key: 'youtube_url',
            value: 'https://youtube.com/yourstore',
            type: 'url',
            category: 'social',
            description: 'YouTube channel URL'
        },
        {
            key: 'linkedin_url',
            value: 'https://linkedin.com/company/yourstore',
            type: 'url',
            category: 'social',
            description: 'LinkedIn company page URL'
        },
        
        // Legal Pages
        {
            key: 'privacy_policy_url',
            value: '/privacy-policy',
            type: 'url',
            category: 'legal',
            description: 'Privacy policy page URL'
        },
        {
            key: 'terms_conditions_url',
            value: '/terms-conditions',
            type: 'url',
            category: 'legal',
            description: 'Terms and conditions page URL'
        },
        {
            key: 'refund_policy_url',
            value: '/refund-policy',
            type: 'url',
            category: 'legal',
            description: 'Refund policy page URL'
        },
        
        // SEO Settings
        {
            key: 'meta_title',
            value: 'E-Commerce Store - Quality Products Online',
            type: 'text',
            category: 'seo',
            description: 'Default meta title for pages'
        },
        {
            key: 'meta_description',
            value: 'Shop quality products online with fast shipping and excellent customer service.',
            type: 'text',
            category: 'seo',
            description: 'Default meta description'
        },
        {
            key: 'meta_keywords',
            value: 'ecommerce, online shopping, quality products',
            type: 'text',
            category: 'seo',
            description: 'Meta keywords for SEO'
        },
        
        // Footer
        {
            key: 'footer_text',
            value: '© 2025 E-Commerce Store. All rights reserved.',
            type: 'text',
            category: 'general',
            description: 'Footer copyright text'
        }
    ];

    for (const setting of defaultSettings) {
        await this.findOneAndUpdate(
            { key: setting.key },
            setting,
            { upsert: true, new: true }
        );
    }
};

module.exports = mongoose.model('Settings', settingsSchema);