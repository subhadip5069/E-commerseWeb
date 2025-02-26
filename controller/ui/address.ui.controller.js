const Address = require("../../model/address");
const banner = require("../../model/banner");
const { Cart } = require("../../model/cart");
const { Subcategory, Category } = require("../../model/category");
const product = require("../../model/product");

class AddressController {

    // ➤ Create Address
     createAddress =async(req, res) => {
        try {
            const { address, city, state, country, pincode, phnumber } = req.body;
            const userId = req.user.id; // Assuming authentication middleware

            const newAddress = new Address({  // ✅ Use correct model name
                user: userId,
                address,
                city,
                state,
                country,
                pincode,
                phnumber // Renamed for clarity
            });

            await newAddress.save();
            console.log("New Address Added:", newAddress);
            res.session.success_msg = "Address added successfully.";

            res.redirect("/cart");  // ✅ Redirect to cart or another relevant page

        } catch (error) {
            console.error("Error adding address:", error);
           res.session.error_msg = "Failed to add address.";
            res.redirect("/cart");
        }
    }

    // ➤ Update Address
    async updateAddress(req, res) {
        try {
            const { addressId } = req.params;
            const { address, city, state, country, pincode,phnumber } = req.body;

            const updatedAddress = await Address.findByIdAndUpdate(
                addressId,
                { address, city, state, country, pincode,phnumber },
                { new: true }
            );

            if (!updatedAddress) {
                res.session.error_msg = "Address not found.";
                return res.redirect("/cart");
            }

            
            res.session.success_msg = "Address updated successfully.";
            res.redirect("/cart");
        } catch (error) {
            console.error(error);
            res.session.error_msg = "Failed to update address.";
            res.redirect("/cart");
        }
    }

    // ➤ Delete Address
    async deleteAddress(req, res) {
        try {
            const { addressId } = req.params;

            const deletedAddress = await Address.findByIdAndDelete(addressId);

            if (!deletedAddress) {
                res.session.error_msg = "Address not found.";
                return res.redirect("/cart");
            }

            res.session.success_msg = "Address deleted successfully.";
            res.redirect("/cart");
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Failed to delete address" });
        }
    }

    // ➤ Get User Addresses
     getUserAddresses=async(req, res) => {
        try {
            const userId = req.user.id;
            const banners = await banner.Banner.find();
            const categories = await Category.find();
            const subcategories = await Subcategory.find().populate("category");
            const products = await product.find().populate("category subcategory");
            const cartItems = await Cart.find({ user: userId }).populate("product");
            const addresses = await Address.find({ user: userId });

            res.render("Ui/address", {
                title:"Orderhistory",
            categories,
            userId,
            subcategory:subcategories,
            products,
            banners,
            cartItems,
                addresses
            });

        } catch (error) {
            console.error(error);
            
        }
    }
}


module.exports = new AddressController();
