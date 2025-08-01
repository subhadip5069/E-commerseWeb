const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    // Basic review information
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100
    },
    review: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    
    // References
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: false
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: false // Link to order for verified purchase
    },
    
    // Review details
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    images: [{
        url: String,
        caption: String
    }],
    
    // Helpfulness tracking
    helpfulVotes: {
        type: Number,
        default: 0
    },
    totalVotes: {
        type: Number,
        default: 0
    },
    helpfulUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    
    // Status and moderation
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Hidden'],
        default: 'Approved'
    },
    moderationNotes: {
        type: String,
        trim: true
    },
    
    // Vendor response
    vendorResponse: {
        response: {
            type: String,
            trim: true,
            maxlength: 500
        },
        respondedAt: Date,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor"
        }
    },
    
    // Additional metadata
    purchaseDate: Date,
    reviewerLocation: {
        city: String,
        state: String,
        country: { type: String, default: 'India' }
    },
    deviceInfo: {
        platform: String,
        browser: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ vendor: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Virtual for helpfulness percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
    return this.totalVotes > 0 ? Math.round((this.helpfulVotes / this.totalVotes) * 100) : 0;
});

// Virtual for star display
reviewSchema.virtual('starDisplay').get(function() {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Static method to calculate average rating for a product
reviewSchema.statics.calculateProductRating = async function(productId) {
    try {
        const result = await this.aggregate([
            { $match: { product: productId, status: 'Approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        if (result.length > 0) {
            const stats = result[0];
            
            // Calculate rating distribution
            const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            stats.ratingDistribution.forEach(rating => {
                distribution[rating]++;
            });

            return {
                averageRating: Math.round(stats.averageRating * 10) / 10,
                totalReviews: stats.totalReviews,
                distribution
            };
        }

        return {
            averageRating: 0,
            totalReviews: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    } catch (error) {
        console.error('Error calculating product rating:', error);
        return {
            averageRating: 0,
            totalReviews: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }
};

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = function(userId, isHelpful) {
    const userIndex = this.helpfulUsers.indexOf(userId);
    
    if (userIndex === -1) {
        // User hasn't voted before
        this.helpfulUsers.push(userId);
        this.totalVotes++;
        if (isHelpful) {
            this.helpfulVotes++;
        }
    } else {
        // User has voted before - update their vote
        const wasHelpful = userIndex < this.helpfulVotes;
        if (isHelpful && !wasHelpful) {
            this.helpfulVotes++;
        } else if (!isHelpful && wasHelpful) {
            this.helpfulVotes--;
        }
    }
    
    return this.save();
};

// Pre-save middleware to update product rating
reviewSchema.post('save', async function() {
    try {
        const Product = mongoose.model('Product');
        const product = await Product.findById(this.product);
        if (product) {
            await product.updateRatings();
        }
    } catch (error) {
        console.error('Error updating product rating after review save:', error);
    }
});

// Pre-remove middleware to update product rating
reviewSchema.post('remove', async function() {
    try {
        const Product = mongoose.model('Product');
        const product = await Product.findById(this.product);
        if (product) {
            await product.updateRatings();
        }
    } catch (error) {
        console.error('Error updating product rating after review removal:', error);
    }
});

module.exports = mongoose.model("Review", reviewSchema);