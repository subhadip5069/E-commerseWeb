const Category = require('../../model/category');
const Subcategory = require('../../model/category');
const Product = require('../../model/product');

// Controller to render the filter page (form)


// Controller to fetch filtered products with pagination
class ProductUIController {
getFilteredProducts = async (req, res) => {
  try {
    const { category, subcategory, minPrice, maxPrice, minRating, maxRating, page = 1, limit = 10 } = req.query;

    let filter = {};
    let { createdDate } = req.query;
   if (createdDate) {
            let startDate = new Date(createdDate);
            let endDate = new Date(createdDate);
            endDate.setHours(23, 59, 59, 999); // End of the selected day

            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        const productsss = await Product.find(filter).sort({ createdAt: -7 });

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (minPrice || maxPrice) {
      filter.currentPrice = {};
      if (minPrice) filter.currentPrice.$gte = minPrice;
      if (maxPrice) filter.currentPrice.$lte = maxPrice;
    }
    if (minRating || maxRating) {
      filter.ratings = {};
      if (minRating) filter.ratings.$gte = minRating;
      if (maxRating) filter.ratings.$lte = maxRating;
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch filtered products with pagination
    const products = await Product.find(filter)
      .populate('category subcategory')
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Fetch all categories and subcategories for the filter form
    const categories = await Category.find().populate('subcategories').exec();

    res.render('Ui/productresult', {
      products,
      categories,
      currentPage: page,
      totalPages,
      totalProducts,
      limit,
      category,
      subcategory,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      productsss
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

}

module.exports = new ProductUIController();