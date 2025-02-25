const { Purchase } = require("../../model/purchase");
const { User } = require("../../model/user");
const { Product } = require("../../model/product");

class AdminController {
    // Get All Purchases
    getAllPurchases= async (req, res) => {
        try {
            const purchases = await Purchase.find()
                .populate("user", "name email") // Fetch user details
                .populate("product", "name price"); // Fetch product details
            res.session.success_msg = req.flash("success_msg");
            res.session.error_msg = req.flash("error_msg");
            res.render("admin/purchase", { purchases });
        } catch (error) {
            console.error("Error fetching purchases:", error);
            res.session.error_msg = "Failed to fetch purchases.";
            res.redirect("/admin/purchase");

        }
    }

    // Get Purchases by User
    getPurchasesByUser = async(req, res) => {
        try {
            const { userId } = req.params;
            const purchases = await Purchase.find({ user: userId })
                .populate("product", "name price");
            res.session.success_msg = req.flash("success_msg");
            res.session.error_msg = req.flash("error_msg");
            res.render("adminpurchase", { purchases });
        } catch (error) {
            console.error("Error fetching user purchases:", error);
            res.session.error_msg = "Failed to fetch user purchases.";
            res.redirect("/adminpurchase");            
        }
    }

    // Delete a Purchase
    deletePurchase = async(req, res) => {
        try {
            const { purchaseId } = req.params;
            await Purchase.findByIdAndDelete(purchaseId);
            res.session.success_msg = "Purchase deleted successfully.";
            res.redirect("/adminpurchase");
        } catch (error) {
            console.error("Error deleting purchase:", error);
            res.session.error_msg = "Failed to delete purchase.";
            res.redirect("/adminpurchase");
        }
    }
}

module.exports = new AdminController;
