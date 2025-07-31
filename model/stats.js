const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'product_varieties',
            'happy_customers', 
            'store_locations',
            'orders_delivered',
            'years_experience',
            'team_members'
        ]
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    displayValue: {
        type: String,
        required: true // e.g., "14k+", "50k+", "10+"
    },
    label: {
        type: String,
        required: true // e.g., "Product Varieties", "Happy Customers"
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better performance
statsSchema.index({ key: 1 });
statsSchema.index({ isActive: 1, sortOrder: 1 });

// Methods to automatically calculate stats
statsSchema.statics.updateProductVarietiesCount = async function() {
    const Product = require('./product');
    const count = await Product.countDocuments({ isActive: true });
    
    await this.findOneAndUpdate(
        { key: 'product_varieties' },
        { 
            value: count,
            displayValue: count > 1000 ? `${Math.floor(count/1000)}k+` : `${count}+`,
            lastUpdated: new Date()
        },
        { upsert: true }
    );
};

statsSchema.statics.updateCustomersCount = async function() {
    const User = require('./user');
    const count = await User.countDocuments({ role: 'user', isVerified: true });
    
    await this.findOneAndUpdate(
        { key: 'happy_customers' },
        { 
            value: count,
            displayValue: count > 1000 ? `${Math.floor(count/1000)}k+` : `${count}+`,
            lastUpdated: new Date()
        },
        { upsert: true }
    );
};

statsSchema.statics.updateOrdersCount = async function() {
    const Order = require('./order');
    const count = await Order.countDocuments({ status: 'delivered' });
    
    await this.findOneAndUpdate(
        { key: 'orders_delivered' },
        { 
            value: count,
            displayValue: count > 1000 ? `${Math.floor(count/1000)}k+` : `${count}+`,
            lastUpdated: new Date()
        },
        { upsert: true }
    );
};

// Method to initialize default stats
statsSchema.statics.initializeDefaultStats = async function() {
    const defaultStats = [
        {
            key: 'product_varieties',
            value: 500,
            displayValue: '500+',
            label: 'Product Varieties',
            description: 'Wide range of products available'
        },
        {
            key: 'happy_customers',
            value: 5000,
            displayValue: '5k+',
            label: 'Happy Customers',
            description: 'Satisfied customers worldwide'
        },
        {
            key: 'store_locations',
            value: 10,
            displayValue: '10+',
            label: 'Store Locations',
            description: 'Physical stores across the country'
        },
        {
            key: 'orders_delivered',
            value: 10000,
            displayValue: '10k+',
            label: 'Orders Delivered',
            description: 'Successfully completed orders'
        },
        {
            key: 'years_experience',
            value: 5,
            displayValue: '5+',
            label: 'Years Experience',
            description: 'Years of industry experience'
        }
    ];

    for (const stat of defaultStats) {
        await this.findOneAndUpdate(
            { key: stat.key },
            stat,
            { upsert: true, new: true }
        );
    }
};

module.exports = mongoose.model('Stats', statsSchema);