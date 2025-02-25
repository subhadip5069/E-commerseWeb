const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const billSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    purchaseid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchase",
        required: true
    },
    addressid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = { Bill: mongoose.model("Bill", billSchema) };