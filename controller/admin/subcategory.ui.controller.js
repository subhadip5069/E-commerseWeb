const { Subcategory } = require("../../model/category");
const { Category } = require("../../model/category");

class SubcategoryController {


  // Get all subcategories
  async  getAllSubcategories(req, res) {
    try {
      // Fetch all categories
      const categories = await Category.find(); 
  
      // Fetch subcategories and populate their category field
      const subcategories = await Subcategory.find().populate("category");
  
      // Retrieve success and error messages from session
      const success_msg = req.session.success_msg;
      const error_msg = req.session.error_msg;
      req.session.success_msg = null;
      req.session.error_msg = null;
  
      // Render the view with both categories and subcategories
      res.render("Admin/subcategory", { categories, subcategories, success_msg, error_msg });
  
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      req.session.error_msg = "Failed to fetch subcategories.";
      res.redirect("/admin/subcategory");
    }
  }

  // Render create subcategory form
  async createSubcategoryForm(req, res) {
    try {
      const categories = await Category.find(); // Fetch categories for dropdown
      res.render("Admin/createsupcategory", { categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      req.session.error_msg = "Failed to load form.";
      res.redirect("/admin/subcategory");
    }
  }

  // Create a new subcategory
  async createSubcategory(req, res) {
    try {
      const { name, category } = req.body;
      const subcategoryimage = req.file ? req.file.path : null;

      if (!name || !category) {
        req.session.error_msg = "All fields are required.";
        return res.redirect("/admin/subcategory/create");
      }

      await Subcategory.create({ name, category,subcategoryImage:subcategoryimage });
      req.session.success_msg = "Subcategory created successfully.";
      res.redirect("/admin/subcategory");
    } catch (error) {
      console.error("Error creating subcategory:", error);
      req.session.error_msg = "Failed to create subcategory.";
      res.redirect("/admin/subcategory/create");
    }
  }

  // Render edit subcategory form
  async editSubcategoryForm(req, res) {
    try {
      const subcategory = await Subcategory.findById(req.params.id);
      const categories = await Category.find(); // Fetch categories for dropdown

      if (!subcategory) {
        req.session.error_msg = "Subcategory not found.";
        return res.redirect("/admin/subcategory");
      }

      res.render("Admin/updatesubcategory", { subcategory, categories });
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      req.session.error_msg = "Failed to fetch subcategory.";
      res.redirect("/admin/subcategory");
    }
  }

  // Update subcategory
  async updateSubcategory(req, res) {
    try {
      const { name, category } = req.body;

      await Subcategory.findByIdAndUpdate(req.params.id, { name, category });

      req.session.success_msg = "Subcategory updated successfully.";
      res.redirect("/admin/subcategory");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      req.session.error_msg = "Failed to update subcategory.";
      res.redirect(`/admin/subcategory/edit/${req.params.id}`);
    }
  }

  // Delete subcategory
  async deleteSubcategory(req, res) {
    try {
      await Subcategory.findByIdAndDelete(req.params.id);
      req.session.success_msg = "Subcategory deleted successfully.";
      res.redirect("/admin/subcategory");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      req.session.error_msg = "Failed to delete subcategory.";
      res.redirect("/admin/subcategory");
    }
  }
}

module.exports = new SubcategoryController();
