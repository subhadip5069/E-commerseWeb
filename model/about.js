const mongoose = require("mongoose");

const schema = mongoose.Schema;

const aboutSchema = new schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    Aboutimage: {
        type: String,
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

module.exports = {
    About: mongoose.model("About", aboutSchema)
    }