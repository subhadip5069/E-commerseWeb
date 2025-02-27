const about = require("../../model/about");
const  Category  = require("../../model/category");
const Product = require("../../model/product");
const Banner = require("../../model/banner");
const Cart = require("../../model/cart");
const mongoose = require("mongoose");
const address = require("../../model/address");
const user = require("../../model/user");
// const product = require("../../model/product");
const { Bill } = require("../../model/bill");


class UserUiController {

    index =async (req, res) => {

console.log("req.user",req.user);
const userId = req.user;

        console.log(userId);
        const banner = await Banner.Banner.find();
        const searchQuery = req.query.query || '';
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate('category subcategory');
        
           
        res.render('Ui/index',{
            title:"index",
            
             categories,
            
            subcategory:subcategories,
            products,
            banners:banner,
            userId,
            searchQuery

        });
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
            const userId = req.user.id;
    
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                req.flash("error_msg", "Invalid user ID");
                return res.redirect("/carts");
            }
    
            const banner = await Banner.Banner.find();
            const searchQuery = req.query.query || '';
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find({ name: new RegExp(searchQuery, 'i') }).populate("category subcategory");
            
            // Fetch cart items and populate the product field
            const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
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
            const cartItems = await Cart.Cart.find({ user: req.user.id }).populate("product");
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
    
            const cartItems = await Cart.Cart.find({ user: new mongoose.Types.ObjectId(userId) }).populate("product");
    
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
            // const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
            
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
            const totalProducts = await Product.countDocuments();
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
        const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
        
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
    
            const cartItems = await Cart.Cart.find({ user: req.user.id }).populate("product");
    
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
        const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
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
    
            const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
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