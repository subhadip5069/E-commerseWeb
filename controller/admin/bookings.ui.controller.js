const { Purchase } = require("../../model/purchase");

const getPurchases = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1; // Default page is 1
        let limit = 5; // Items per page
        let skip = (page - 1) * limit;
        let searchQuery = req.query.search || ""; // Get search term

        let filter = {}; // Search filter

        if (searchQuery) {
            filter = {
                $or: [
                    { Address: { $regex: searchQuery, $options: "i" } }, // Search by address
                ],
                $or: [
                    { "user.name": { $regex: searchQuery, $options: "i" } }, // Search by user name
                    { "user.email": { $regex: searchQuery, $options: "i" } }, // Search by user email
                ],
                $or: [
                    { "product.name": { $regex: searchQuery, $options: "i" } }, // Search by product name
                ],$or: [
                    { "product.category.name": { $regex: searchQuery, $options: "i" } }, // Search by product name
                ]
                ,$or: [
                    { "product.category.subcategory.name": { $regex: searchQuery, $options: "i" } }, // Search by product name
                ]
            };
        }

        const totalPurchases = await Purchase.countDocuments(filter);
        const totalPages = Math.ceil(totalPurchases / limit);

        const purchases = await Purchase.find(filter)
            .populate("user", "name email") // Fetch user name & email
            .populate("product", "name") // Fetch product name
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render("Admin/bookings", {
            purchases,
            currentPage: page,
            totalPages,
            searchQuery
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { getPurchases };
