const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const posterSchema = new Schema({
    title: {    
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['isVerified', 'notVerified'],
        default: 'notVerified'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = {
    Poster: mongoose.model("Poster", posterSchema)
    }