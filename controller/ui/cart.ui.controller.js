const { Cart } = require("../../model/cart");
const { Product } = require("../../model/product");

class CartController {
    // Get Cart Items
    getCart=async(req, res) => {
        try {
            const userId = req.user._id; // Assuming user is authenticated
            const cartItems = await Cart.find({ user: userId }).populate("product");

            res.session.success_msg = req.flash("success_msg");
            res.session.error_msg = req.flash("error_msg");

            res.render("Ui/cart", { cartItems });
        } catch (error) {
            console.error("Error fetching cart:", error);
          
        }
    }

    // Add to Cart
    
         addToCart=async(req, res) =>{
        try {
            const { productId, quantity } = req.body;
            const userId = req.user._id;

            let cartItem = await Cart.findOne({ user: userId, product: productId });

            if (cartItem) {
                // If item already exists, update quantity
                cartItem.quantity += parseInt(quantity);
                await cartItem.save();
            } else {
                // Create new cart item
                cartItem = new Cart({
                    user: userId,
                    product: productId,
                    quantity
                });
                await cartItem.save();
                
            }

            res.session.success_msg = "Product added to cart successfully.";
            res.redirect("/cart");
        } catch (error) {
            console.error("Error adding to cart:", error);
            res.session.error_msg = "Failed to add product to cart.";
            res.redirect("/cart");
        }
    }

    // Remove from Cart
    removeFromCart=async(req, res) => {
        try {
            const { cartId } = req.params;
            await Cart.findByIdAndDelete(cartId);
            req.session.success_msg = "Product removed from cart successfully.";
            res.redirect("/cart");
        } catch (error) {
            console.error("Error removing cart item:", error);
            req.session.error_msg = "Failed to remove product from cart.";
            res.redirect("/cart");
        }
    }
}

module.exports = CartController;
