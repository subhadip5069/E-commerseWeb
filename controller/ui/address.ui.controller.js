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

            res.redirect("/cart");  // ✅ Redirect to cart or another relevant page

        } catch (error) {
            console.error("Error adding address:", error);
            res.status(500).json({ success: false, message: "Failed to add address" }); // ✅ Ensure proper status code
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
                return res.status(404).json({ success: false, message: "Address not found" });
            }

            res.json({ success: true, message: "Address updated successfully", updatedAddress });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Failed to update address" });
        }
    }

    // ➤ Delete Address
    async deleteAddress(req, res) {
        try {
            const { addressId } = req.params;

            const deletedAddress = await Address.findByIdAndDelete(addressId);

            if (!deletedAddress) {
                return res.status(404).json({ success: false, message: "Address not found" });
            }

            res.json({ success: true, message: "Address deleted successfully" });

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
