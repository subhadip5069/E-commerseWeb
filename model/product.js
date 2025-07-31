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
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    seoTitle: {
      type: String,
      default: function() { return this.name; }
    },
    seoDescription: {
      type: String,
      default: function() { return this.description; }
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Add indexes for better performance
ProductSchema.index({ isActive: 1, isFeatured: 1, sortOrder: 1 });
ProductSchema.index({ isActive: 1, isNewArrival: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, isOnSale: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ subcategory: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to generate SEO-friendly slug
ProductSchema.pre('save', function (next) {
  if (!this.isModified('name')) return next();
  this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

module.exports = mongoose.model('Product', ProductSchema);