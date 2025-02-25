const mongoose = require("mongoose");
const { create } = require("./user");

const Schema = mongoose.Schema;

const notloginusersSchema = new Schema({
  
    posters: {
        type: [String],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = {
    Notloginusers: mongoose.model("Notloginusers", notloginusersSchema)
    };