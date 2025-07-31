const { Cart } = require("../../model/cart");
const mongoose = require("mongoose");
const Product = require("../../model/product");

class CartController {
    // Add to Cart
    

    addToCart = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                req.flash('error_msg', 'Please login to add items to cart');
                return res.redirect("/login");
            }

            const { productId, quantity } = req.body;
            
            if (!productId || !quantity) {
                req.flash('error_msg', 'Invalid product or quantity');
                return res.redirect("back");
            }
    
            const cartItem = await Cart.findOne({
                user: req.user.id,
                product: productId
            });
           
            if (cartItem) {
                cartItem.quantity = Number(cartItem.quantity) + Number(quantity);
                await cartItem.save();
                req.flash('success_msg', 'Item quantity updated in cart');
            } else {
                await Cart.create({
                    user: req.user.id,
                    product: productId,
                    quantity: Number(quantity)
                });
                req.flash('success_msg', 'Item added to cart successfully');
            }
        
            res.redirect("/cart");
            
        } catch (error) {
            console.error('Add to cart error:', error);
            req.flash('error_msg', 'Failed to add item to cart');
            res.redirect("back");
        }
    };
    // Remove from Cart
    async removeFromCart(req, res) {
        try {
           
            

            const deletedItem = await Cart.findByIdAndDelete(req.params.id);

            console.log(deletedItem,"deletedItem");
            

            req.flash('success_msg' = "Product removed from cart successfully.";
            res.redirect("/cart");
        } catch (error) {
            console.error("Error removing cart item:", error);
            req.flash("error_msg" = "Failed to remove product from cart.";
            res.redirect("/login");
        }
    }

    // View Cart
;

// Update cart quantity
updateCartQuantity = async (req, res) => {
    try {
        const { quantity } = req.body;
        const cartId = req.params.id;

        if (quantity <= 0) {
            return res.redirect("/cart");
        }

        // Find the cart item
        const cartItem = await Cart.findByIdAndUpdate(cartId).populate("product");

        if (!cartItem) {
            console.log("Cart item not found");
            return res.redirect("/cart");
        }

        // ✅ Update and Save
        cartItem.quantity = quantity;
        await cartItem.save();

        const updatedTotal = cartItem.product.currentPrice * quantity;
        return res.redirect("/cart");

        

    } catch (error) {
        console.error(error);
        return res.redirect("/cart");
    }
};
saveForLater = async (req, res) => {
    try {
        const cartItem = await Cart.findById(req.params.id);
        res.redirect("/cart");


        const SavedItem = new SavedCart({
            user: cartItem.user,
            product: cartItem.product,
            quantity: cartItem.quantity,
        });

        await SavedItem.save();
        await Cart.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.redirect("/cart");
    }

   
}
}

module.exports = new CartController();
