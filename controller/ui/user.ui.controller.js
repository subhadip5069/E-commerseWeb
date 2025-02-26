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
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find().populate('category subcategory');
        res.render('Ui/index',{
            title:"index",
            
             categories,
            subcategory:subcategories,
            products,
            banners:banner,
            userId

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

        const banner = await Banner.Banner.find();
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find().populate('category subcategory');
            const abouts = await about.About.find(); // Fetch all about records from the database
            res.render('Ui/about', {
                 abouts , categories,
                 userId,
                 subcategory:subcategories,
                 products,
                 banners:banner,
                 userId
                }); // Pass abouts to the EJS template
        } catch (error) {
            console.error('Error fetching about data:', error);
            req.flash('error_msg', 'Error loading About Us page');
            res.redirect('/about');
        }
    }
    contactUs =async (req,res) => {
        
        const banner = await Banner.Banner.find();
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find().populate('category subcategory');
        const userId = req.user;

      
        res.render('Ui/contactus',{
            title:"Contact Us",
            categories,
            userId,
            subcategory:subcategories,
                 products,
                 banners:banner,
        });
    }
    cart = async (req, res) => {
        try {
            // ✅ Extract only the user ID
            const userId = req.user.id ;
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find().populate("category subcategory");
            const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
            const addresses = await address.find({ user: userId });
            
            if(!userId){
                res.redirect("/carts");
                
            }
    
            // ✅ Validate the ObjectId before querying
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                res.flash("error_msg", "Invalid user ID");
                res.redirect("/carts");
            }
    
            // Fetch data
            
    
            // Render the cart page
            res.render("Ui/cart", {
                title: "Cart",
                categories,
                subcategory: subcategories,
                products,
                banners: banner,
                cart:cartItems,
                cartItems,
                userId,
                addresses
            });
    
        } catch (error) {
            console.error("Error fetching cart:", error);
            res.redirect("/carts");
        }
    }
    carts=async(req,res) =>{
        const userId = null;
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find().populate("category subcategory");
            const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
            res.render("Ui/carts", {
                title: "Cart",
                
            categories,
            subcategory: subcategories,
            products,
            banners: banner,
            cartItems,
            userId
    });


    }
    
     product = async (req, res) => {
        try {
           
    
            const userId = req.user.id; // Extract user ID
            console.log("User ID:", userId);
    
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
                product: products
            });
        } catch (error) {
            console.error("Error fetching product:", error);
            res.redirect("/");
        }
    };
    
    

    
    
 
    productDetails = async (req, res) => {
        try {
            const userId = req.user;
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find().populate('category subcategory');
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
                userId
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
    
            // Fetch Data
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find({});
            const subcategories = await Category.Subcategory.find().populate("category");
            const totalProducts = await Product.countDocuments();
            const products = await Product.find()
                .populate("category subcategory")
                .skip(skip)
                .limit(limit);
                // Fetch all subcategories
            
                const selectedCategory = req.query.category || ""; 
                const selectedSubcategory = req.query.subcategory || "";
                const selectedPrice = req.query.price || "";
            
                
            const totalPages = Math.ceil(totalProducts / limit);
    
            res.render("Ui/products", {
                title: "Products",
                categories,
                subcategory: subcategories,
                subcategories,
                products,
                banners: banner,
                userId,
                totalPages,
                currentPage: page,
                selectedCategory,
                selectedSubcategory,
                selectedPrice
            });
        } catch (error) {
            res.redirect("/");
        }
    };
    filterProducts = async (req, res) => {
        try { 
            
            const userId = req.user;
            const page = parseInt(req.query.page) || 1;
            const limit = 6; // Number of products per page
            const skip = (page - 1) * limit;
    

          const { category, subcategory, minPrice, maxPrice } = req.query;
          const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const totalProducts = await Product.countDocuments();
           
          // Create a filter object
          let filter = {};
      
          if (category) {
            filter.category = category;
          }
      
          if (subcategory) {
            filter.subcategory = subcategory;
          }
      
          if (minPrice || maxPrice) {
            filter.currentPrice = {};
            if (minPrice) {
              filter.currentPrice.$gte = parseFloat(minPrice);
            }
            if (maxPrice) {
              filter.currentPrice.$lte = parseFloat(maxPrice);
            }
          }
      
          // Fetch filtered products
          const products = await Product.find(filter)
            .populate('category', 'name') 
            .populate('subcategory', 'name');
      
          res.render('Ui/products', { products, categories, subcategory: subcategories, banners: banner, userId, currentPage: page, totalPages: Math.ceil(totalProducts / limit) }); // Ensure 'products.ejs' exists
        } catch (error) {
          res.redirect('/products');
        }
      };
    
    
    
    bill =async(req,res) =>{
        const userId = req.user;


        const banner = await Banner.Banner.find();
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find().populate('category subcategory');
        const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
        
        res.render('Ui/bill',{
            title:"Bill",
            categories,
            userId,subcategory:subcategories,
            products,
            banners:banner,
            cartItems,

        })
    }
    Orderhistory = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; // Default to page 1
            const limit = parseInt(req.query.limit) || 5; // Default to 5 orders per page
            const skip = (page - 1) * limit;
    
            const userId = req.user.id;
            console.log("User ID:", userId);
    
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find().populate("category subcategory");
            console.log("Products:", products);
    
            const cartItems = await Cart.Cart.find({ user: userId }).populate("product");
    
            // Fetch orders with proper population
            const orders = await Bill.find({ userid: userId })
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
    
            const totalOrders = await Bill.countDocuments({ userid: userId });
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
                totalPages
            });
    
        } catch (error) {
            console.error("Error in fetching order history:", error);
        res.session.error_msg = "Failed to fetch order history. Please try again.";
        res.redirect("/orderhistory");
        }
    };
    
    
    
    
    profile =async (req,res)=>{


        const userId = req.user?.id;
        console.log(userId,"profile");


        const banner = await Banner.Banner.find();
        const categories = await Category.Category.find();
        const subcategories = await Category.Subcategory.find().populate("category");
        const products = await Product.find().populate('category subcategory');
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
            addresses
        })

    }
    orderDetails = async (req,res)=>{
        try {
            const userId = req.user.id;
            console.log("User ID:", userId);
    
            const banner = await Banner.Banner.find();
            const categories = await Category.Category.find();
            const subcategories = await Category.Subcategory.find().populate("category");
            const products = await Product.find().populate("category subcategory");
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
            userId,subcategory:subcategories,
            products,
            banners:banner,
            cartItems,
            order:orders
        })
    }
    catch (error) {
        console.error("Error fetching order details:", error);
        res.redirect("/login");
    }
    }
}

module.exports = new UserUiController;