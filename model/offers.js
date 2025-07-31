const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const offersSchema = new Schema({
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
    link: {
        type: String,
        default: "#"
    },
    discountPercentage: {
        type: Number,
        default: 0
    },
    backgroundColor: {
        type: String,
        default: "#007bff"
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
    sectionType: {
        type: String,
        enum: ['sale', 'combo', 'discount', 'featured', 'banner'],
        default: 'sale'
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validTo: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
}, {
    timestamps: true
});

// Add indexes for better performance
offersSchema.index({ isActive: 1, sectionType: 1, sortOrder: 1 });
offersSchema.index({ validFrom: 1, validTo: 1 });

module.exports = mongoose.model("Offers", offersSchema);