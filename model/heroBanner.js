const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const heroBannerSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        required: true
    },
    mobileImage: {
        type: String,
        default: ""
    },
    buttonText: {
        type: String,
        default: "Shop Now"
    },
    buttonLink: {
        type: String,
        default: "/products"
    },
    textPosition: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'left'
    },
    overlayColor: {
        type: String,
        default: "rgba(0,0,0,0.3)"
    },
    textColor: {
        type: String,
        default: "#ffffff"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    displayType: {
        type: String,
        enum: ['hero', 'secondary', 'promotional'],
        default: 'hero'
    }
}, {
    timestamps: true
});

// Add indexes for better performance
heroBannerSchema.index({ isActive: 1, displayType: 1, sortOrder: 1 });

module.exports = mongoose.model("HeroBanner", heroBannerSchema);