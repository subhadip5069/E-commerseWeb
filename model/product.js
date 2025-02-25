const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    launchingPrice: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    ratings: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    images: {
      type: [String], // Array of image URLs
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'You can upload up to 10 images only.',
      },
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate SEO-friendly slug
ProductSchema.pre('save', function (next) {
  if (!this.isModified('name')) return next();
  this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

module.exports = mongoose.model('Product', ProductSchema);