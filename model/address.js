const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const addressSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fullName: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
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
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);
