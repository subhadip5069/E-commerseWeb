const mongoose = require('mongoose');
const Settings = require('../model/settings');
const Stats = require('../model/stats');
const User = require('../model/user');
const bcrypt = require('bcrypt');
require('dotenv').config();

const initializeDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('🚀 Initializing database with default data...\n');

        // 1. Initialize Settings
        console.log('📱 Initializing default settings...');
        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            await Settings.initializeDefaultSettings();
            console.log('✅ Default settings initialized successfully');
        } else {
            console.log('ℹ️  Settings already exist, skipping...');
        }

        // 2. Initialize Stats
        console.log('\n📊 Initializing default stats...');
        const statsCount = await Stats.countDocuments();
        if (statsCount === 0) {
            await Stats.initializeDefaultStats();
            console.log('✅ Default stats initialized successfully');
        } else {
            console.log('ℹ️  Stats already exist, skipping...');
        }

        // 3. Create default admin user
        console.log('\n👤 Creating default admin user...');
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (!existingAdmin) {
            const defaultAdminData = {
                username: 'admin',
                email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@ecommerce.com',
                password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456', 12),
                phone: '9999999999',
                isVerified: true,
                role: 'admin',
                status: 'active'
            };

            const admin = new User(defaultAdminData);
            await admin.save();

            console.log('✅ Default admin user created successfully!');
            console.log(`📧 Email: ${defaultAdminData.email}`);
            console.log(`🔑 Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456'}`);
            console.log('⚠️  Please change the default password after first login.');
        } else {
            console.log('ℹ️  Admin user already exists, skipping...');
        }

        // 4. Update dynamic stats based on current data
        console.log('\n🔄 Updating dynamic stats...');
        try {
            await Stats.updateProductVarietiesCount();
            await Stats.updateCustomersCount();
            await Stats.updateOrdersCount();
            console.log('✅ Dynamic stats updated successfully');
        } catch (error) {
            console.log('⚠️  Some stats could not be updated (models may not exist yet)');
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   • Settings: ${await Settings.countDocuments()} entries`);
        console.log(`   • Stats: ${await Stats.countDocuments()} entries`);
        console.log(`   • Admin users: ${await User.countDocuments({ role: 'admin' })} users`);
        console.log(`   • Total users: ${await User.countDocuments()} users`);

    } catch (error) {
        console.error('❌ Error initializing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📤 Disconnected from MongoDB');
    }
};

// Check if script is run directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;