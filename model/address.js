const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const addressSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    phnumber: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);
