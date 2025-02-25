const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
      index: true,  // Add index for better performance
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,  // Add index for better performance
    },
    password: {
      type: String,
      required: true,
      minlength: [6, 'Password must be at least 6 characters long'],  // Validate password length
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    orderHistory: {
      type: Array,
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }  // Automatically manage createdAt and updatedAt
);

module.exports = mongoose.model("User", userSchema);
