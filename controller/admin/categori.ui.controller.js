const { Category, Subcategory } = require('../../model/category');
const flash = require('connect-flash');

class AdminCategoryController {
  // Show categories with pagination
  async getCategories(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      // Fetch categories with subcategories populated
      const categories = await Category.find()
        .populate({
          path: 'subcategories',
          select: 'name',
        })
        .skip(skip)
        .limit(limit)
        .lean();
        const subcategories = await Subcategory.find().populate('category', '_id').lean();

      const totalCategories = await Category.countDocuments();
      const totalPages = Math.ceil(totalCategories / limit) || 1;
      
      // req.flash('success_msg', 'Category created successfully.');
      // req.flash('error_msg', 'Failed to create category. Category name may already exist.');

      //   if (req.flash('success_msg')) {
      //     res.locals.success_msg = req.flash('success_msg');
      //   }
      //   if (req.flash('error_msg')) {
      //     res.locals.error_msg = req.flash('error_msg');
      //   }

      //   if(categories.length === 0) {
      //     req.flash('error_msg', 'No categories found.');
      //   }

      //   if(categories.length > 0) {
      //     req.flash('success_msg', 'Categories fetched successfully.');
      //   }

      res.render('Admin/category', {
        categories,
        currentPage: page,
        totalPages,
        subcategories,
        // success_msg: req.flash('success_msg'),
        // error_msg: req.flash('error_msg'),
       
        
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      // res.status(500).send('Failed to retrieve categories.');
      res.redirect('/admin/category');
    }
  }

  // Create a new category
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      const category = new Category({ name });
      await category.save();
      // req.flash('success_msg', 'Category created successfully.');
      req.session.success_msg = 'Form created successfully!';
      res.redirect('/admin/category');
    } catch (error) {
      console.error('Error creating category:', error);
      // req.flash('error_msg', 'Failed to create category. Category name may already exist.');
      req.session.error_msg = 'Failed to create category. Category name may already exist.';
      res.redirect('/admin/category');
    }
  }
}

module.exports = new AdminCategoryController();
