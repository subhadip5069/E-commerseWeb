const about = require("../../model/about");
const  Category  = require("../../model/category");
const Product = require("../../model/product");
const Banner = require("../../model/banner");
const { Cart } = require("../../model/cart");
const mongoose = require("mongoose");
const address = require("../../model/address");
const user = require("../../model/user");
const { Bill } = require("../../model/bill");
const HeroBanner = require("../../model/heroBanner");
const Offers = require("../../model/offers");
const Stats = require("../../model/stats");
const Settings = require("../../model/settings");


class UserUiController {

    index = async (req, res) => {
        try {
            console.log("req.user", req.user);
            const userId = req.user;
            const searchQuery = req.query.query || '';

            // Fetch all dynamic data in parallel for better performance with error handling
            const [
                heroBanners,
                promotionalOffers,
                categories,
                subcategories,
                featuredProducts,
                newArrivalProducts,
                saleProducts,
                allProducts,
                banners,
                websiteStats,
                settings
            ] = await Promise.all([
                // Hero banners for main carousel
                HeroBanner.find({ 
                    isActive: true, 
                    displayType: 'hero' 
                }).sort({ sortOrder: 1 }).catch(() => []),

                // Promotional offers for banner sections
                Offers.find({ 
                    isActive: true,
                    validFrom: { $lte: new Date() },
                    validTo: { $gte: new Date() }
                }).sort({ sectionType: 1, sortOrder: 1 }).catch(() => []),

                // Categories for navigation
                Category.Category.find({ isActive: { $ne: false } }).sort({ sortOrder: 1, name: 1 }).catch(() => []),

                // Subcategories for navigation
                Category.Subcategory.find({ isActive: { $ne: false } })
                    .populate("category")
                    .sort({ sortOrder: 1, name: 1 }).catch(() => []),

                // Featured products section
                Product.find({ 
                    isActive: true, 
                    isFeatured: true,
                    stock: { $gt: 0 }
                }).populate('category subcategory')
                  .sort({ sortOrder: 1, createdAt: -1 })
                  .limit(8).catch(() => []),

                // New arrival products
                Product.find({ 
                    isActive: true, 
                    isNewArrival: true,
                    stock: { $gt: 0 }
                }).populate('category subcategory')
                  .sort({ createdAt: -1 })
                  .limit(8).catch(() => []),

                // Sale products
                Product.find({ 
                    isActive: true, 
                    isOnSale: true,
                    stock: { $gt: 0 }
                }).populate('category subcategory')
                  .sort({ sortOrder: 1, createdAt: -1 })
                  .limit(8).catch(() => []),

                // All products for search functionality
                searchQuery 
                    ? Product.find({ 
                        isActive: true,
                        $or: [
                            { name: new RegExp(searchQuery, 'i') },
                            { description: new RegExp(searchQuery, 'i') }
                        ]
                      }).populate('category subcategory')
                        .sort({ isFeatured: -1, createdAt: -1 }).catch(() => [])
                    : Product.find({ isActive: true })
                        .populate('category subcategory')
                        .sort({ isFeatured: -1, isNewArrival: -1, createdAt: -1 })
                        .limit(20).catch(() => []),

                // Legacy banner support
                Banner.Banner.find({ isActive: { $ne: false } }).sort({ sortOrder: 1 }).catch(() => []),

                // Website statistics
                Stats.find({ isActive: true }).sort({ sortOrder: 1 }).catch(() => []),

                // Website settings
                Settings.getAllSettings().catch(() => ({}))
            ]);

            // Group promotional offers by section type
            const offersBySectionType = {
                sale: promotionalOffers.filter(offer => offer.sectionType === 'sale'),
                combo: promotionalOffers.filter(offer => offer.sectionType === 'combo'),
                discount: promotionalOffers.filter(offer => offer.sectionType === 'discount'),
                banner: promotionalOffers.filter(offer => offer.sectionType === 'banner')
            };

            // Calculate statistics for admin reference with timeout
            let totalProductsCount = 0;
            if (mongoose.connection.readyState !== 1) {
                console.log('Database not connected, using product array length');
                totalProductsCount = allProducts.length;
            } else {
                try {
                    totalProductsCount = await Promise.race([
                        Product.countDocuments({ isActive: true }),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Product count timeout')), 3000)
                        )
                    ]);
                } catch (error) {
                    console.error('Error counting products:', error.message);
                    totalProductsCount = allProducts.length; // Fallback to array length
                }
            }

            const pageStats = {
                totalProducts: totalProductsCount,
                featuredCount: featuredProducts.length,
                newArrivalCount: newArrivalProducts.length,
                saleCount: saleProducts.length,
                totalCategories: categories.length,
                activeOffers: promotionalOffers.length
            };

            res.render('Ui/index', {
                title: "Dynamic E-Commerce Store",
                // User data
                userId,
                searchQuery,
                
                // Dynamic banners and offers
                heroBanners,
                banners, // Legacy support
                offers: offersBySectionType,
                
                // Product sections
                products: allProducts,
                featuredProducts,
                newArrivalProducts,
                saleProducts,
                
                // Navigation data
                categories,
                subcategory: subcategories,
                
                // Statistics (can be used in admin or for conditional rendering)
                stats: websiteStats,
                
                // Website settings
                settings,
                
                // Helper functions for templates
                helpers: {
                    formatPrice: (price) => `₹${price.toLocaleString()}`,
                    calculateDiscount: (original, current) => 
                        Math.round(((original - current) / original) * 100),
                    truncateText: (text, length = 50) => 
                        text.length > length ? text.substring(0, length) + "..." : text
                }
            });

        } catch (error) {
            console.error("Error loading homepage:", error);
            res.status(500).render('error', { 
                status: 500,
                message: "Unable to load homepage. Please try again later.", 
                error: process.env.NODE_ENV === 'development' ? error : {},
                title: "Error",
                settings: {},
                stats: []
            });
        }
    };
    login = async (req,res) =>{
        res.render('Ui/login',{messages: req.flash()})
    }
    signup = (req,res) =>{
        res.render('Ui/signup')
    }
    about  = async (req,res) => {
        try {
         const userId =  req.user ;
         const searchQuery = req.query.query || '';
        const banner = await Banner.Banner.find();
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate('category subcategory');
       
           
            const abouts = await about.About.find(); // Fetch all about records from the database
            res.render('Ui/about', {
                 abouts , categories,
                 userId,
                 subcategory:subcategories,
                 products,
                 banners:banner,
                 userId,
                 searchQuery
                }); // Pass abouts to the EJS template
        } catch (error) {
            console.error('Error fetching about data:', error);
            req.flash('error_msg', 'Error loading About Us page');
            res.redirect('/about');
        }
    }
    contactUs =async (req,res) => {
        
        const banner = await Banner.Banner.find();
        const searchQuery = req.query.query || '';
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate('category subcategory');
        const userId = req.user;
       

      
        res.render('Ui/contactus',{
            title:"Contact Us",
            categories,
            userId,
            subcategory:subcategories,
                 products,
                 banners:banner,
                 
                 searchQuery
        });
    }
    cart = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                req.flash("error_msg", "Please login to view your cart");
                return res.redirect("/login");
            }

            const userId = req.user.id;
    
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                req.flash("error_msg", "Invalid user ID");
                return res.redirect("/login");
            }
    
            const banner = await Banner.Banner.find();
            const searchQuery = req.query.query || '';
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate("category subcategory");
            
            // Fetch cart items and populate the product field
            const cartItems = await Cart.find({ user: userId }).populate("product");
            console.log("Cart Items Before Filtering:", cartItems);
    
            // Filter out items where product is null
            const validCartItems = cartItems.filter(item => item.product !== null);
            console.log("Valid Cart Items After Filtering:", validCartItems);
    
            const addresses = await address.find({ user: userId });
    
            res.render("Ui/cart", {
                title: "Cart",
                categories,
                subcategory: subcategories,
                products,
                banners: banner,
                cart: validCartItems, // Only valid cart items
                userId,
                addresses,
                searchQuery
            });
    
        } catch (error) {
            console.error("Error fetching cart:", error);
            res.redirect("/carts");
        }
    };
    
    carts=async(req,res) =>{
        const userId = req.user.id || null;
            const banner = await Banner.Banner.find();
            const searchQuery = req.query.query || '';
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate("category subcategory");
            const cartItems = await Cart.find({ user: req.user.id }).populate("product");
            const validCartItems = cartItems.filter(item => item.product !== null);
            console.log(validCartItems);
            console.log(cartItems);
            
            res.render("Ui/carts", {
                title: "Cart",
                
            categories,
            subcategory: subcategories,
            products,
            banners: banner,
            cartItems: validCartItems,
            userId,
            searchQuery
           
    });


    }
    
     product = async (req, res) => {
        try {
           
    
            const userId = req.user.id || null; // Extract user ID
            console.log("User ID:", userId);
            const searchQuery = req.query.query || '';
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
    
            const cartItems = await Cart.find({ user: new mongoose.Types.ObjectId(userId) }).populate("product");
    
            // ✅ Use `Product` model instead of `product` function
            const products = await Product.findById(req.params.id).populate("category subcategory");
    
            if (!products) {
                return res.redirect("/cart");
            }
    
            console.log("Product ID:", products.id);
    
            res.render('Ui/product', {
                title: "Product",
                categories,
                subcategory: subcategories,
                cart: cartItems,
                banners: banner,
                userId,
                product: products,
                searchQuery
            });
        } catch (error) {
            console.error("Error fetching product:", error);
            res.redirect("/");
        }
    };
    
    

    
    
 
    productDetails = async (req, res) => {
        try {
            const userId = req.user;
            const searchQuery = req.query.query || '';
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate('category subcategory');
            // const cartItems = await Cart.find({ user: userId }).populate("product");
            
            const product = await Product.findById( req.params.id).populate("category subcategory");
            if (!product) {
                return res.redirect("/products");
            }
            res.render("Ui/productresult", {
                title: "Product Details",
                product,
                categories,
                subcategory: subcategories,
                products,
                banners: banner,
                // cartItems,
                userId,
                searchQuery
            });
        } catch (error) {
            res.redirect("/products");
            
        }
    }
     products = async (req, res) => {
        try {
            const userId = req.user;
            const page = parseInt(req.query.page) || 1;
            const limit = 6; // Number of products per page
            const skip = (page - 1) * limit;
             // Get search query from URL params
             const { category, subcategory, minPrice, maxPrice, minRating, maxRating } = req.query;
          

            // Fetch Data
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find({});
            const subcategories = await Category.Subcategory.find().populate("category");
            let totalProducts = 0;
            if (mongoose.connection.readyState !== 1) {
                console.log('Database not connected, using 0 for product count');
                totalProducts = 0;
            } else {
                try {
                    totalProducts = await Promise.race([
                        Product.countDocuments(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Product count timeout')), 3000)
                        )
                    ]);
                } catch (error) {
                    console.error('Error counting products in listing:', error.message);
                    totalProducts = 0; // Fallback
                }
            }
            const searchQuery = req.query.query || '';
            const products = await Product.find({ name: new RegExp(searchQuery, 'i') })
                .populate("category subcategory")
                .skip(skip)
                .limit(limit);
                // Fetch all subcategories
            
                const selectedCategory = req.query.category || ""; 
                const selectedSubcategory = req.query.subcategory || "";
                const selectedPrice = req.query.price || "";
                if (category) {
                    filter.category = category;
                  }
              
                  if (subcategory) {
                    filter.subcategory = subcategory;
                  }
              
                  if (minPrice || maxPrice|| minRating || maxRating) {
                    filter.currentPrice = {};
                    if (minPrice) {
                      filter.currentPrice.$gte = parseFloat(minPrice);
                    }
                    if (maxPrice) {
                      filter.currentPrice.$lte = parseFloat(maxPrice);
                    }
                    if (minRating) {
                      filter.ratings.$gte = parseFloat(minRating);
                    }
                    if (maxRating) {
                      filter.ratings.$lte = parseFloat(maxRating);
                    }
        
                  }
        
            
                
            const totalPages = Math.ceil(totalProducts / limit);
    
            res.render("Ui/products", {
                title: "Products",
                categories,
                subcategory: subcategories,
                subcategories,
                category:categories,
                products,
                banners: banner,
                userId,
                totalPages,
                currentPage: page,
                selectedCategory,
                selectedSubcategory,
                selectedPrice,
                searchQuery,
                minPrice,
                maxPrice,
                minRating,
                maxRating
            });
        } catch (error) {
            res.redirect("/");
        }
    };
    filterProducts = async (req, res) => {
        try { 
            const userId = req.user;
            const page = parseInt(req.query.page) || 1;
            const limit = 6; // Products per page
            const skip = (page - 1) * limit;
            const searchQuery = req.query.query || '';
    
            const { category, subcategory, minPrice, maxPrice, minRating, maxRating, sortBy } = req.query;
    
            // Fetch categories, subcategories, and banners
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const banner = await Banner.Banner.find();
    
            // Create filter object
            let filter = {};
    
            if (category) filter.category = category;  // ✅ Filter by category
            if (subcategory) filter.subcategory = subcategory;
    
            if (minPrice || maxPrice) {
                filter.currentPrice = {};
                if (minPrice) filter.currentPrice.$gte = Number(minPrice);
                if (maxPrice) filter.currentPrice.$lte = Number(maxPrice);
            }
    
            if (minRating || maxRating) {
                filter.ratings = {};
                if (minRating) filter.ratings.$gte = Number(minRating);
                if (maxRating) filter.ratings.$lte = Number(maxRating);
            }
    
            if (searchQuery) {
                filter.name = new RegExp(searchQuery, 'i');
            }
    
            // Sorting Options
            const validSortOptions = {
                newest: { createdAt: -1 },
                oldest: { createdAt: 1 },
                priceLow: { currentPrice: 1 },
                priceHigh: { currentPrice: -1 },
                ratingHigh: { ratings: -1 },
                ratingLow: { ratings: 1 }
            };
            const sortOption = validSortOptions[sortBy] || { createdAt: -1 }; // Default: Newest products first
    
            // Count products for pagination
            const totalFilteredProducts = await Product.countDocuments(filter);
    
            // Fetch products based on filter, sorting, and pagination
            const products = await Product.find(filter)
                .populate('category', 'name') 
                .populate('subcategory', 'name')
                .sort(sortOption)
                .skip(skip)
                .limit(limit);
    
            res.render('Ui/productresult', {
                searchQuery,
                products,
                categories,
                subcategory: subcategories, 
                banners: banner,
                userId, 
                currentPage: page, 
                selectedCategory: category,  // ✅ Pass selected category to UI
                totalPages: Math.ceil(totalFilteredProducts / limit), 
                maxPrice,
                minPrice,
                minRating,
                maxRating,
                sortBy
            });
    
        } catch (error) {
            console.error("Error in filterProducts:", error);
            res.redirect('/products');
        }
    };
    
    bill =async(req,res) =>{
        const userId = req.user;

        const searchQuery = req.query.query || '';
        const banner = await Banner.Banner.find();
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate('category subcategory');
        const cartItems = await Cart.find({ user: userId }).populate("product");
        
        res.render('Ui/bill',{
            title:"Bill",
            categories,
            userId,subcategory:subcategories,
            products,
            banners:banner,
            cartItems,
            searchQuery

        })
    }
    Orderhistory = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; // Default to page 1
            const limit = parseInt(req.query.limit) || 5; // Default to 5 orders per page
            const skip = (page - 1) * limit;
            const searchQuery = req.query.query || '';
    
            const userId = req.user;
            console.log("User ID:", userId);
    
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate("category subcategory");
            console.log("Products:", products);
    
            const cartItems = await Cart.find({ user: req.user.id }).populate("product");
    
            // Fetch orders with proper population
            const orders = await Bill.find({ userid: req.user.id })
            .populate("userid", "name email") 
            .populate({
                path: "purchaseid",
                populate: {
                    path: "items.product",
                    model: "Product",
                    populate: [
                        { path: "category", model: "Category" },
                        { path: "subcategory", model: "Subcategory" }
                    ]
                }
            })
            .populate("addressid")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    
            console.log("Orders:", JSON.stringify(orders, null, 2)); // Debugging
    
            const totalOrders = await Bill.countDocuments({ userid: req.user.id });
            const totalPages = Math.ceil(totalOrders / limit);
    
            res.render('Ui/Orderhistory', {
                title: "Order History",
                categories,
                userId,
                subcategory: subcategories,
                products,
                banners: banner,
                cartItems,
                orders,
                currentPage: page,
                totalPages,
                searchQuery
            });
    
        } catch (error) {
            console.error("Error in fetching order history:", error);
        res.session.error_msg = "Failed to fetch order history. Please try again.";
        res.redirect("/login");
        }
    };
    
    
    
    
    profile =async (req,res)=>{


        const userId = req.user?.id;
        console.log(userId,"profile");
        const searchQuery = req.query.query || '';

        const banner = await Banner.Banner.find();
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate('category subcategory');
        const cartItems = await Cart.find({ user: userId }).populate("product");
        const profile = await user.findById(userId);
        const addresses = await address.find({ user: userId });
        
        res.render('Ui/profile',{
            title:"Profile",
            categories,
            userId,subcategory:subcategories,
            products,
            banners:banner,
            cartItems,
            profile,
            addresses,
            searchQuery
        })

    }
    orderDetails = async (req,res)=>{
        try {
            const userId = req.user;
            console.log("User ID:", userId);
            const searchQuery = req.query.query || '';
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate("category subcategory");
            console.log("Products:", products);
    
            const cartItems = await Cart.find({ user: userId }).populate("product");
            const orders = await Bill.findById(req.params.id)
            .populate("userid", "name email") 
            .populate({
                path: "purchaseid",
                populate: {
                    path: "items.product",
                    model: "Product",
                    populate: [
                        { path: "category", model: "Category" },
                        { path: "subcategory", model: "Subcategory" }
                    ]
                }
            })
            .populate("addressid")
            .sort({ createdAt: -1 })
            
    
            // Fetch orders with proper population
        
        res.render('Ui/orderDetails',{
            title:"OrderDetails",
            categories,
            userId,
            subcategory:subcategories,
            products,
            banners:banner,
            cartItems,
            order:orders,
            searchQuery
        })
    }
    catch (error) {
        console.error("Error fetching order details:", error);
        res.redirect("/login");
    }
    }
}

module.exports = new UserUiController;