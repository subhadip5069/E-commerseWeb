const Category = require('../../model/category');
const Subcategory = require('../../model/category');
const Product = require('../../model/product');

// Controller to render the filter page (form)


// Controller to fetch filtered products with pagination
class ProductUIController {
  getFilteredProducts = async (req, res) => {
    try {
      const userId = req.user.id;
      const { category, subcategory, minPrice, maxPrice, minRating, maxRating, createdDate, page = 1, limit = 10, query } = req.query;
  
      let filter = {};
      if (query) {
        filter.name = { $regex: query, $options: "i" }; // Case-insensitive search by name
      }
  
      // Other filtering logic remains unchanged...
  
      // Fetch products
      const products = await Product.find(filter)
        .populate('category subcategory')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .exec();
  console.log("products",products)
      // Fetch all categories
      const categories = await Category.Category.find().populate('subcategories').exec();
  
      res.render('Ui/products', {
        products,
        categories,
        currentPage: page,
        totalPages: Math.ceil(await Product.countDocuments(filter) / limit),
        totalProducts: await Product.countDocuments(filter),
        limit,
        category,
        subcategory,
        minPrice,
        maxPrice,
        minRating,
        maxRating,
        searchQuery: query || "" ,
        userId // Pass `searchQuery`
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).send("Internal Server Error");
    }
  };
  

 searchProducts = async (req, res) => {
  try {
    const { query: searchQuery, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { category: searchQuery },
        { subcategory: searchQuery },
        { currentPrice: !isNaN(searchQuery) ? Number(searchQuery) : undefined },
        { ratings: !isNaN(searchQuery) ? Number(searchQuery) : undefined }
      ].filter(condition => Object.values(condition)[0] !== undefined);
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category subcategory')
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const categories = await Category.find().populate('subcategories').exec();
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.render('Ui/products', {
     searchQuery,
      products,
      categories,
      currentPage: page,
      totalPages,
      totalProducts,
      limit,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    req.flash('error', 'Failed to search products.');
    res.redirect('back');
  }
};



}

module.exports = new ProductUIController();