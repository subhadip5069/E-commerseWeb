const addressModel = require("../../model/address");
const  banners  = require("../../model/banner");
const { Category, Subcategory } = require("../../model/category");
const product = require("../../model/product");
const { Purchase } = require("../../model/purchase"); // Corrected import
const { Cart } = require("../../model/cart"); // Ensure Cart is imported

class PurchaseController {
    
    // Create a new purchase
    createPurchase = async (req, res) => {
        try {
            const { user, items, subtotal, gst, sgst, total,shippingCharge } = req.body;
        
            // Validate input data
            
        
            if (!req.user || !req.user.id) {
                return res.redirect("/login"); // Ensure user is authenticated
            }
        
            const newPurchase = new Purchase({ 
                user: req.user.id,  // Using authenticated user's ID
                items, 
                subtotal, 
                gst, 
                sgst, 
                total,
                shippingCharge
            
            });
        
            const savedPurchase = await newPurchase.save();
            console.log("savedPurchase",savedPurchase);
            // Redirect with success message and purchase ID
            res.redirect(`/payment/bill/${savedPurchase.id}`);
            console.log("savedPurchase",savedPurchase.id);
        
        } catch (error) {
            console.error("Error creating purchase:", error);
            
        }
    };

    // Find purchase by ID
    getPurchaseById = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id// Fix missing userId

            if (!userId) {
                return res.redirect("/login");
            }

            const categories = await Category.find();
            const subcategories = await Subcategory.find().populate("category");
            const products = await product.find().populate("category subcategory");
            const cartItems = await Cart.find({ user: userId }).populate("product"); // Fixed cart fetching
            const banner = await banners.Banner.find();
            const address = await addressModel.find({ user: userId });
             // Fixed address model reference
             console.log("address",cartItems);

            const purchase = await Purchase.findById(id)
                .populate("user")
                .populate("items.product");

            if (!purchase) {
                return res.redirect("/cart"); // Redirect if purchase not found
            }

            res.render("Ui/bill", {userId, purchase, categories, subcategory : subcategories, products, cart:cartItems, banner, address });
        } catch (error) {
            console.error("Error fetching purchase:", error);
            res.redirect("/cart");
        }
    };
}

module.exports = new PurchaseController();
