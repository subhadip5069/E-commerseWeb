const Product = require('../../model/product');
const Category = require('../../model/category');
const Subcategory = require('../../model/subcategory');
const Vendor = require('../../model/vendor');

class SearchController {

    // Main search functionality
    search = async (req, res) => {
        try {
            const {
                q: query = '',
                category = '',
                subcategory = '',
                vendor = '',
                minPrice = '',
                maxPrice = '',
                rating = '',
                inStock = '',
                featured = '',
                onSale = '',
                sortBy = 'relevance',
                page = 1,
                limit = 12
            } = req.query;

            // Build search query
            const searchQuery = this.buildSearchQuery({
                query,
                category,
                subcategory,
                vendor,
                minPrice,
                maxPrice,
                rating,
                inStock,
                featured,
                onSale
            });

            // Build sort options
            const sortOptions = this.buildSortOptions(sortBy);

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Execute search with pagination
            const [products, totalCount, categories, vendors] = await Promise.all([
                Product.find(searchQuery)
                    .populate('category subcategory vendor', 'name businessName')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit)),
                Product.countDocuments(searchQuery),
                Category.find({ isActive: true }).select('name'),
                Vendor.find({ 
                    verificationStatus: 'Approved', 
                    isActive: true, 
                    isBlocked: false 
                }).select('businessName')
            ]);

            // Get price range for filters
            const priceRange = await this.getPriceRange(query, category, subcategory);

            // Get faceted search results for filters
            const facets = await this.getFacets(query, category, subcategory);

            const totalPages = Math.ceil(totalCount / parseInt(limit));

            // Check if this is an AJAX request
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    products,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages,
                        totalCount,
                        hasNext: parseInt(page) < totalPages,
                        hasPrev: parseInt(page) > 1
                    },
                    filters: {
                        priceRange,
                        facets,
                        categories,
                        vendors
                    }
                });
            }

            res.render('Ui/search', {
                title: query ? `Search Results for "${query}"` : 'Search Products',
                products,
                query,
                filters: {
                    category,
                    subcategory,
                    vendor,
                    minPrice,
                    maxPrice,
                    rating,
                    inStock,
                    featured,
                    onSale,
                    sortBy
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                },
                priceRange,
                facets,
                categories,
                vendors,
                sortOptions: this.getSortOptions()
            });

        } catch (error) {
            console.error('Search error:', error);
            req.flash('error_msg', 'Error performing search');
            res.redirect('/');
        }
    };

    // Build MongoDB search query
    buildSearchQuery = (filters) => {
        const query = {
            isActive: true,
            approvalStatus: 'Approved'
        };

        // Text search
        if (filters.query) {
            query.$or = [
                { name: { $regex: filters.query, $options: 'i' } },
                { description: { $regex: filters.query, $options: 'i' } },
                { tags: { $regex: filters.query, $options: 'i' } },
                { 'specifications.brand': { $regex: filters.query, $options: 'i' } }
            ];
        }

        // Category filter
        if (filters.category) {
            query.category = filters.category;
        }

        // Subcategory filter
        if (filters.subcategory) {
            query.subcategory = filters.subcategory;
        }

        // Vendor filter
        if (filters.vendor) {
            query.vendor = filters.vendor;
        }

        // Price range filter
        if (filters.minPrice || filters.maxPrice) {
            query.currentPrice = {};
            if (filters.minPrice) {
                query.currentPrice.$gte = parseFloat(filters.minPrice);
            }
            if (filters.maxPrice) {
                query.currentPrice.$lte = parseFloat(filters.maxPrice);
            }
        }

        // Rating filter
        if (filters.rating) {
            query.ratings = { $gte: parseFloat(filters.rating) };
        }

        // Stock filter
        if (filters.inStock === 'true') {
            query.stock = { $gt: 0 };
        }

        // Featured filter
        if (filters.featured === 'true') {
            query.isFeatured = true;
        }

        // Sale filter
        if (filters.onSale === 'true') {
            query.isOnSale = true;
        }

        return query;
    };

    // Build sort options
    buildSortOptions = (sortBy) => {
        switch (sortBy) {
            case 'price_low_high':
                return { currentPrice: 1 };
            case 'price_high_low':
                return { currentPrice: -1 };
            case 'rating':
                return { ratings: -1, totalReviews: -1 };
            case 'newest':
                return { createdAt: -1 };
            case 'popular':
                return { totalSales: -1, ratings: -1 };
            case 'discount':
                return { isOnSale: -1, createdAt: -1 };
            case 'alphabetical':
                return { name: 1 };
            default: // relevance
                return { totalSales: -1, ratings: -1, createdAt: -1 };
        }
    };

    // Get available sort options
    getSortOptions = () => {
        return [
            { value: 'relevance', label: 'Relevance' },
            { value: 'price_low_high', label: 'Price: Low to High' },
            { value: 'price_high_low', label: 'Price: High to Low' },
            { value: 'rating', label: 'Customer Rating' },
            { value: 'newest', label: 'Newest First' },
            { value: 'popular', label: 'Most Popular' },
            { value: 'discount', label: 'Highest Discount' },
            { value: 'alphabetical', label: 'A to Z' }
        ];
    };

    // Get price range for filters
    getPriceRange = async (query, category, subcategory) => {
        try {
            const baseQuery = {
                isActive: true,
                approvalStatus: 'Approved'
            };

            if (query) {
                baseQuery.$or = [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { tags: { $regex: query, $options: 'i' } }
                ];
            }

            if (category) baseQuery.category = category;
            if (subcategory) baseQuery.subcategory = subcategory;

            const result = await Product.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: null,
                        minPrice: { $min: '$currentPrice' },
                        maxPrice: { $max: '$currentPrice' }
                    }
                }
            ]);

            return result.length > 0 ? result[0] : { minPrice: 0, maxPrice: 10000 };
        } catch (error) {
            console.error('Error getting price range:', error);
            return { minPrice: 0, maxPrice: 10000 };
        }
    };

    // Get faceted search results for dynamic filters
    getFacets = async (query, category, subcategory) => {
        try {
            const baseQuery = {
                isActive: true,
                approvalStatus: 'Approved'
            };

            if (query) {
                baseQuery.$or = [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { tags: { $regex: query, $options: 'i' } }
                ];
            }

            if (category) baseQuery.category = category;
            if (subcategory) baseQuery.subcategory = subcategory;

            // Get brand facets
            const brands = await Product.aggregate([
                { $match: baseQuery },
                { $group: { _id: '$specifications.brand', count: { $sum: 1 } } },
                { $match: { _id: { $ne: null, $ne: '' } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            // Get rating distribution
            const ratings = await Product.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: { $floor: '$ratings' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: -1 } }
            ]);

            return {
                brands: brands.map(b => ({ name: b._id, count: b.count })),
                ratings: ratings.map(r => ({ rating: r._id, count: r.count }))
            };
        } catch (error) {
            console.error('Error getting facets:', error);
            return { brands: [], ratings: [] };
        }
    };

    // Search suggestions for autocomplete
    suggestions = async (req, res) => {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.json({ suggestions: [] });
            }

            // Get product suggestions
            const productSuggestions = await Product.find({
                isActive: true,
                approvalStatus: 'Approved',
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { tags: { $regex: q, $options: 'i' } },
                    { 'specifications.brand': { $regex: q, $options: 'i' } }
                ]
            })
            .select('name')
            .limit(5);

            // Get category suggestions
            const categorySuggestions = await Category.find({
                isActive: true,
                name: { $regex: q, $options: 'i' }
            })
            .select('name')
            .limit(3);

            // Get brand suggestions
            const brandSuggestions = await Product.aggregate([
                {
                    $match: {
                        isActive: true,
                        approvalStatus: 'Approved',
                        'specifications.brand': { $regex: q, $options: 'i' }
                    }
                },
                { $group: { _id: '$specifications.brand' } },
                { $limit: 3 }
            ]);

            const suggestions = [
                ...productSuggestions.map(p => ({ type: 'product', text: p.name })),
                ...categorySuggestions.map(c => ({ type: 'category', text: c.name })),
                ...brandSuggestions.map(b => ({ type: 'brand', text: b._id }))
            ];

            res.json({ suggestions });

        } catch (error) {
            console.error('Suggestions error:', error);
            res.json({ suggestions: [] });
        }
    };

    // Category page with products
    categoryPage = async (req, res) => {
        try {
            const { categoryId } = req.params;
            const {
                subcategory = '',
                minPrice = '',
                maxPrice = '',
                rating = '',
                sortBy = 'popular',
                page = 1,
                limit = 12
            } = req.query;

            const category = await Category.findById(categoryId);
            if (!category) {
                req.flash('error_msg', 'Category not found');
                return res.redirect('/');
            }

            // Build query for category products
            const query = {
                category: categoryId,
                isActive: true,
                approvalStatus: 'Approved'
            };

            if (subcategory) query.subcategory = subcategory;
            if (minPrice || maxPrice) {
                query.currentPrice = {};
                if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
                if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
            }
            if (rating) query.ratings = { $gte: parseFloat(rating) };

            const sortOptions = this.buildSortOptions(sortBy);
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [products, totalCount, subcategories] = await Promise.all([
                Product.find(query)
                    .populate('subcategory vendor', 'name businessName')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit)),
                Product.countDocuments(query),
                Subcategory.find({ 
                    category: categoryId, 
                    isActive: true 
                }).select('name')
            ]);

            const totalPages = Math.ceil(totalCount / parseInt(limit));

            res.render('Ui/category', {
                title: category.name,
                category,
                products,
                subcategories,
                filters: {
                    subcategory,
                    minPrice,
                    maxPrice,
                    rating,
                    sortBy
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                },
                sortOptions: this.getSortOptions()
            });

        } catch (error) {
            console.error('Category page error:', error);
            req.flash('error_msg', 'Error loading category');
            res.redirect('/');
        }
    };

    // Vendor store page
    vendorStore = async (req, res) => {
        try {
            const { vendorId } = req.params;
            const {
                category = '',
                minPrice = '',
                maxPrice = '',
                sortBy = 'newest',
                page = 1,
                limit = 12
            } = req.query;

            const vendor = await Vendor.findById(vendorId);
            if (!vendor || vendor.verificationStatus !== 'Approved') {
                req.flash('error_msg', 'Vendor store not found');
                return res.redirect('/');
            }

            // Build query for vendor products
            const query = {
                vendor: vendorId,
                isActive: true,
                approvalStatus: 'Approved'
            };

            if (category) query.category = category;
            if (minPrice || maxPrice) {
                query.currentPrice = {};
                if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
                if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
            }

            const sortOptions = this.buildSortOptions(sortBy);
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [products, totalCount, vendorCategories] = await Promise.all([
                Product.find(query)
                    .populate('category subcategory', 'name')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit)),
                Product.countDocuments(query),
                Product.aggregate([
                    { $match: { vendor: vendor._id, isActive: true, approvalStatus: 'Approved' } },
                    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
                    { $unwind: '$categoryInfo' },
                    { $group: { _id: '$category', name: { $first: '$categoryInfo.name' }, count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ])
            ]);

            const totalPages = Math.ceil(totalCount / parseInt(limit));

            res.render('Ui/vendor-store', {
                title: `${vendor.businessName} - Store`,
                vendor,
                products,
                vendorCategories,
                filters: {
                    category,
                    minPrice,
                    maxPrice,
                    sortBy
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                },
                sortOptions: this.getSortOptions()
            });

        } catch (error) {
            console.error('Vendor store error:', error);
            req.flash('error_msg', 'Error loading vendor store');
            res.redirect('/');
        }
    };

}

module.exports = new SearchController();