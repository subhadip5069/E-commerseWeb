const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            socketTimeoutMS: 45000, // 45 second socket timeout
            bufferMaxEntries: 0, // Disable mongoose buffering
            maxPoolSize: 10, // Maintain up to 10 socket connections
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error; // Let the calling function handle the error
    }
}

module.exports = connectDB;