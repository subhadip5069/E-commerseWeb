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
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: false // Can be null for admin-created products
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    ratings: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0
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
    specifications: {
      brand: { type: String, trim: true },
      model: { type: String, trim: true },
      color: { type: String, trim: true },
      size: { type: String, trim: true },
      weight: { type: String, trim: true },
      dimensions: { type: String, trim: true },
      material: { type: String, trim: true },
      warranty: { type: String, trim: true },
      additionalInfo: [{ 
        key: { type: String, trim: true },
        value: { type: String, trim: true }
      }]
    },
    variants: [{
      name: { type: String, trim: true }, // e.g., "Size", "Color"
      options: [{ 
        label: { type: String, trim: true }, // e.g., "Large", "Red"
        price: { type: Number },
        stock: { type: Number, default: 0 },
        sku: { type: String, trim: true }
      }]
    }],
    shipping: {
      weight: { type: Number }, // in kg
      dimensions: {
        length: { type: Number }, // in cm
        width: { type: Number },
        height: { type: Number }
      },
      freeShipping: { type: Boolean, default: false },
      shippingCharge: { type: Number, default: 0 }
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
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved' // Admin products auto-approved, vendor products pending
    },
    rejectionReason: {
      type: String,
      trim: true
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
    tags: [{ type: String, trim: true }],
    slug: {
      type: String,
      unique: true,
    },
    totalSales: {
      type: Number,
      default: 0
    },
    lastStockUpdate: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add indexes for better performance
ProductSchema.index({ isActive: 1, isFeatured: 1, sortOrder: 1 });
ProductSchema.index({ isActive: 1, isNewArrival: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, isOnSale: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ subcategory: 1, isActive: 1 });
ProductSchema.index({ vendor: 1, isActive: 1 });
ProductSchema.index({ approvalStatus: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ ratings: -1, totalReviews: -1 });
ProductSchema.index({ totalSales: -1 });

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (this.launchingPrice > this.currentPrice) {
    return Math.round(((this.launchingPrice - this.currentPrice) / this.launchingPrice) * 100);
  }
  return 0;
});

// Virtual for availability status
ProductSchema.virtual('availabilityStatus').get(function() {
  if (this.stock <= 0) return 'Out of Stock';
  if (this.stock <= 5) return 'Limited Stock';
  return 'In Stock';
});

// Virtual for product type
ProductSchema.virtual('productType').get(function() {
  return this.vendor ? 'Vendor Product' : 'Store Product';
});

// Pre-save hook to generate SEO-friendly slug
ProductSchema.pre('save', function (next) {
  if (!this.isModified('name')) return next();
  this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

// Pre-save hook to set approval status for vendor products
ProductSchema.pre('save', function (next) {
  if (this.isNew && this.vendor) {
    this.approvalStatus = 'Pending';
  }
  next();
});

// Static method to get products by vendor
ProductSchema.statics.getByVendor = function(vendorId, options = {}) {
  const query = { vendor: vendorId, isActive: true };
  
  if (options.approvalStatus) {
    query.approvalStatus = options.approvalStatus;
  }
  
  return this.find(query)
    .populate('category subcategory')
    .sort(options.sort || { createdAt: -1 });
};

// Instance method to update ratings
ProductSchema.methods.updateRatings = async function(newRating) {
  try {
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ product: this._id });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      this.ratings = totalRating / reviews.length;
      this.totalReviews = reviews.length;
    } else {
      this.ratings = 0;
      this.totalReviews = 0;
    }
    
    await this.save();
  } catch (error) {
    console.error('Error updating product ratings:', error);
  }
};

// Instance method to update stock
ProductSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    this.stock = Math.max(0, this.stock - quantity);
  } else if (operation === 'increase') {
    this.stock += quantity;
  } else {
    this.stock = quantity;
  }
  
  this.lastStockUpdate = new Date();
  return this.save();
};

module.exports = mongoose.model('Product', ProductSchema);