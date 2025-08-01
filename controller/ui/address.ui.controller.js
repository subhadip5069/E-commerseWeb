const Address = require("../../model/address");
const Banner = require("../../model/banner");
const { Cart } = require("../../model/cart");
const { Category, Subcategory } = require("../../model/category");
const Product = require("../../model/product");
const mongoose = require("mongoose");

class AddressController {

    // ➤ Display all user addresses (Profile page)
    getUserAddresses = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                req.flash('error_msg', 'Please login to view addresses');
                return res.redirect('/login');
            }

            const userId = req.user.id;
            const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });

            res.render('Ui/addresses', {
                title: 'My Addresses',
                addresses,
                user: req.user,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error("Error fetching addresses:", error);
            req.flash('error_msg', 'Error loading addresses');
            res.redirect('/profile');
        }
    };

    // ➤ Show add address form
    showAddAddressForm = async (req, res) => {
        try {
            const redirectTo = req.query.redirect || '/addresses';
            
            res.render('Ui/add-address', {
                title: 'Add New Address',
                user: req.user,
                redirectTo,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error("Error showing add address form:", error);
            req.flash('error_msg', 'Error loading form');
            res.redirect('/addresses');
        }
    };

    // ➤ Create new address
    createAddress = async (req, res) => {
        try {
            const { fullName, phone, address, landmark, city, state, country, pincode, addressType, isDefault, redirectTo } = req.body;
            const userId = req.user.id;

            // Validate required fields
            if (!fullName || !phone || !address || !city || !state || !pincode) {
                req.flash('error_msg', 'Please fill all required fields');
                return res.redirect('/addresses/add');
            }

            // If this is set as default, unset other default addresses
            if (isDefault === 'on') {
                await Address.updateMany(
                    { user: userId },
                    { $unset: { isDefault: 1 } }
                );
            }

            const newAddress = new Address({
                user: userId,
                fullName,
                phone,
                address,
                landmark: landmark || '',
                city,
                state,
                country: country || 'India',
                pincode: parseInt(pincode),
                phnumber: parseInt(phone),
                addressType: addressType || 'Home',
                isDefault: isDefault === 'on'
            });

            await newAddress.save();
            req.flash('success_msg', 'Address added successfully');

            // Redirect based on where user came from
            const finalRedirect = redirectTo || '/addresses';
            res.redirect(finalRedirect);

        } catch (error) {
            console.error("Error adding address:", error);
            req.flash('error_msg', 'Failed to add address');
            res.redirect('/addresses/add');
        }
    };

    // ➤ Show edit address form
    showEditAddressForm = async (req, res) => {
        try {
            const { addressId } = req.params;
            const userId = req.user.id;
            const redirectTo = req.query.redirect || '/addresses';

            const address = await Address.findOne({ _id: addressId, user: userId });

            if (!address) {
                req.flash('error_msg', 'Address not found');
                return res.redirect('/addresses');
            }

            res.render('Ui/edit-address', {
                title: 'Edit Address',
                address,
                user: req.user,
                redirectTo,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error("Error showing edit address form:", error);
            req.flash('error_msg', 'Error loading address');
            res.redirect('/addresses');
        }
    };

    // ➤ Update address
    updateAddress = async (req, res) => {
        try {
            const { addressId } = req.params;
            const { fullName, phone, address, landmark, city, state, country, pincode, addressType, isDefault, redirectTo } = req.body;
            const userId = req.user.id;

            // Validate required fields
            if (!fullName || !phone || !address || !city || !state || !pincode) {
                req.flash('error_msg', 'Please fill all required fields');
                return res.redirect(`/addresses/edit/${addressId}`);
            }

            // If this is set as default, unset other default addresses
            if (isDefault === 'on') {
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
                    landmark: landmark || '',
                    city,
                    state,
                    country: country || 'India',
                    pincode: parseInt(pincode),
                    phnumber: parseInt(phone),
                    addressType: addressType || 'Home',
                    isDefault: isDefault === 'on'
                },
                { new: true }
            );

            if (!updatedAddress) {
                req.flash('error_msg', 'Address not found');
                return res.redirect('/addresses');
            }

            req.flash('success_msg', 'Address updated successfully');
            
            // Redirect based on where user came from
            const finalRedirect = redirectTo || '/addresses';
            res.redirect(finalRedirect);

        } catch (error) {
            console.error("Error updating address:", error);
            req.flash('error_msg', 'Failed to update address');
            res.redirect(`/addresses/edit/${req.params.addressId}`);
        }
    };

    // ➤ Delete address
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
                return res.redirect('/addresses');
            }

            req.flash('success_msg', 'Address deleted successfully');
            res.redirect('/addresses');

        } catch (error) {
            console.error("Error deleting address:", error);
            req.flash('error_msg', 'Failed to delete address');
            res.redirect('/addresses');
        }
    };

    // ➤ Set default address
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
            console.error("Error setting default address:", error);
            res.json({ success: false, message: 'Failed to update default address' });
        }
    };

    // ➤ Get addresses for checkout (API endpoint)
    getAddressesForCheckout = async (req, res) => {
        try {
            const userId = req.user.id;
            const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });

            res.json({
                success: true,
                addresses
            });

        } catch (error) {
            console.error("Error fetching addresses for checkout:", error);
            res.json({ success: false, message: 'Failed to fetch addresses' });
        }
    };

    // ➤ Address selection page for checkout
    selectAddressForCheckout = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                req.flash('error_msg', 'Please login to continue');
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
            const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
            
            // Calculate cart totals
            const subtotal = cartItems.reduce((sum, item) => sum + (item.product.currentPrice * item.quantity), 0);
            const gst = subtotal * 0.05; // 5% GST
            const sgst = subtotal * 0.05; // 5% SGST
            const shipping = subtotal > 500 ? 0 : 50; // Free shipping over 500
            const total = subtotal + gst + sgst + shipping;

            res.render('Ui/select-address', {
                title: 'Select Delivery Address',
                addresses,
                cartItems,
                user: req.user,
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
            console.error("Error loading address selection:", error);
            req.flash('error_msg', 'Error loading addresses');
            res.redirect('/cart');
        }
    };

}

module.exports = new AddressController();
