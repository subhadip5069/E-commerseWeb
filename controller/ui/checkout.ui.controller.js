const Address = require("../../model/address");
const { Cart } = require("../../model/cart");
const { Category } = require("../../model/category");
const Product = require("../../model/product");
const User = require("../../model/user");

class CheckoutController {

    // Display checkout page with address selection and payment options
    checkoutPage = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                req.flash('error_msg', 'Please login to proceed with checkout');
                return res.redirect('/login');
            }

            const userId = req.user.id;
            
            // Get user's cart items
            const cartItems = await Cart.find({ user: userId }).populate('product');
            
            if (!cartItems || cartItems.length === 0) {
                req.flash('error_msg', 'Your cart is empty');
                return res.redirect('/cart');
            }

            // Get user's saved addresses
            const addresses = await Address.find({ user: userId });
            
            // Get user details
            const user = await User.findById(userId);
            
            // Calculate cart totals
            const subtotal = cartItems.reduce((sum, item) => sum + (item.product.currentPrice * item.quantity), 0);
            const gst = subtotal * 0.05; // 5% GST
            const sgst = subtotal * 0.05; // 5% SGST
            const shipping = subtotal > 500 ? 0 : 50; // Free shipping over 500
            const total = subtotal + gst + sgst + shipping;

            res.render('Ui/checkout', {
                title: 'Checkout',
                cartItems,
                addresses,
                user,
                pricing: {
                    subtotal,
                    gst,
                    sgst,
                    shipping,
                    total
                },
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Checkout page error:', error);
            req.flash('error_msg', 'Error loading checkout page');
            res.redirect('/cart');
        }
    };

    // Add new address during checkout
    addAddress = async (req, res) => {
        try {
            const { fullName, phone, address, city, state, country, pincode, isDefault } = req.body;
            const userId = req.user.id;

            // If this is set as default, unset other default addresses
            if (isDefault) {
                await Address.updateMany(
                    { user: userId },
                    { $unset: { isDefault: 1 } }
                );
            }

            const newAddress = new Address({
                user: userId,
                fullName: fullName || req.user.username,
                phone: phone || req.user.phone,
                address,
                city,
                state,
                country,
                pincode: parseInt(pincode),
                phnumber: parseInt(phone),
                isDefault: isDefault === 'on'
            });

            await newAddress.save();
            req.flash('success_msg', 'Address added successfully');
            
            // Return JSON response for AJAX requests
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    message: 'Address added successfully',
                    address: newAddress
                });
            }
            
            res.redirect('/checkout');

        } catch (error) {
            console.error('Add address error:', error);
            req.flash('error_msg', 'Failed to add address');
            
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: false,
                    message: 'Failed to add address'
                });
            }
            
            res.redirect('/checkout');
        }
    };

    // Update existing address
    updateAddress = async (req, res) => {
        try {
            const { addressId } = req.params;
            const { fullName, phone, address, city, state, country, pincode, isDefault } = req.body;
            const userId = req.user.id;

            // If this is set as default, unset other default addresses
            if (isDefault) {
                await Address.updateMany(
                    { user: userId, _id: { $ne: addressId } },
                    { $unset: { isDefault: 1 } }
                );
            }

            const updatedAddress = await Address.findOneAndUpdate(
                { _id: addressId, user: userId },
                {
                    fullName,
                    phone,
                    address,
                    city,
                    state,
                    country,
                    pincode: parseInt(pincode),
                    phnumber: parseInt(phone),
                    isDefault: isDefault === 'on'
                },
                { new: true }
            );

            if (!updatedAddress) {
                req.flash('error_msg', 'Address not found');
                return res.redirect('/checkout');
            }

            req.flash('success_msg', 'Address updated successfully');
            res.redirect('/checkout');

        } catch (error) {
            console.error('Update address error:', error);
            req.flash('error_msg', 'Failed to update address');
            res.redirect('/checkout');
        }
    };

    // Delete address
    deleteAddress = async (req, res) => {
        try {
            const { addressId } = req.params;
            const userId = req.user.id;

            const deletedAddress = await Address.findOneAndDelete({
                _id: addressId,
                user: userId
            });

            if (!deletedAddress) {
                req.flash('error_msg', 'Address not found');
                return res.redirect('/checkout');
            }

            req.flash('success_msg', 'Address deleted successfully');
            res.redirect('/checkout');

        } catch (error) {
            console.error('Delete address error:', error);
            req.flash('error_msg', 'Failed to delete address');
            res.redirect('/checkout');
        }
    };

    // Set default address
    setDefaultAddress = async (req, res) => {
        try {
            const { addressId } = req.params;
            const userId = req.user.id;

            // Unset all default addresses for this user
            await Address.updateMany(
                { user: userId },
                { $unset: { isDefault: 1 } }
            );

            // Set the selected address as default
            const updatedAddress = await Address.findOneAndUpdate(
                { _id: addressId, user: userId },
                { isDefault: true },
                { new: true }
            );

            if (!updatedAddress) {
                return res.json({ success: false, message: 'Address not found' });
            }

            res.json({ success: true, message: 'Default address updated' });

        } catch (error) {
            console.error('Set default address error:', error);
            res.json({ success: false, message: 'Failed to update default address' });
        }
    };

}

module.exports = new CheckoutController();