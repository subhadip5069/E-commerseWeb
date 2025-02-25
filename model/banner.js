const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BannerSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    Bannerimage: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = { Banner: mongoose.model("Banner", BannerSchema)}