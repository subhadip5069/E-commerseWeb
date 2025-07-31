const mongoose = require('mongoose');
const User = require('../model/user');
const bcrypt = require('bcrypt');
require('dotenv').config();

const createDefaultAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if any admin user exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email);
            return;
        }

        // Create default admin user
        const defaultAdminData = {
            username: 'admin',
            email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@ecommerce.com',
            password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123', 12),
            phone: '9999999999',
            isVerified: true,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const admin = new User(defaultAdminData);
        await admin.save();

        console.log('Default admin user created successfully!');
        console.log('Email:', defaultAdminData.email);
        console.log('Password:', process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123');
        console.log('Please change the default password after first login.');

    } catch (error) {
        console.error('Error creating default admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the script
createDefaultAdmin();

module.exports = createDefaultAdmin;