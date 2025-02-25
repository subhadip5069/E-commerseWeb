const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const purchaseSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    subtotal: {
        type: Number,
        required: true
    },
    gst: {
        type: Number,
        required: true
    },
    sgst: {
        type: Number,
        required: true
    },
    shippingCharge: {
        type: Number,
       
    },
    total: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = {
    Purchase: mongoose.model("Purchase", purchaseSchema)
    }