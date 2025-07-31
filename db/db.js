const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Set mongoose options globally
        mongoose.set('bufferCommands', false);
        
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000, // 30 second timeout
            socketTimeoutMS: 75000, // 75 second socket timeout
            connectTimeoutMS: 30000, // 30 second connect timeout
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Minimum 2 connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            waitQueueTimeoutMS: 5000, // 5 second wait queue timeout
            heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error;
    }
}

module.exports = connectDB;