const { Banner } = require("../../model/banner");
const fs = require("fs");
const path = require("path");

class BannerController {
  constructor() {}

  // Get all banners
  async getAllBanners(req, res) {
    try {
      const banners = await Banner.find();
      req.session.success_msg = req.flash("success_msg");
      req.session.error_msg = req.flash("error_msg");
      res.render("Admin/banner", { banners});
    } catch (error) {
      console.error("Error fetching banners:", error);
      req.session.error_msg = "Failed to fetch banners.";
      res.redirect("/admin/banner");
    }
  }

  // Render the form to create a new banner
  createBannerForm(req, res) {
    res.render("Admin/createbanner");
  }

  // Create a new banner
  async createBanner(req, res) {
    try {
      const { title, description } = req.body;
      const Bannerimage = req.file ? req.file.path : null;
      console.log(Bannerimage);

      if (!title || !description || !Bannerimage) {
        req.session.error_msg = "All fields are required.";
        return res.redirect("/admin/banner/create");
      }

      await Banner.create({ title, description, Bannerimage });
      req.session.success_msg = "Banner created successfully.";
      res.redirect("/admin/banner");
    } catch (error) {
      console.error("Error creating banner:", error);
      req.session.error_msg = "Failed to create banner.";
      res.redirect("/admin/banner/create");
    }
  }

  // Render the edit form for a banner
  async editBannerForm(req, res) {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) {
        req.session.error_msg = "Banner not found.";
        return res.redirect("/admin/banner");
      }
      res.render("Admin/updatebanner", { banner });
    } catch (error) {
      console.error("Error fetching banner:", error);
      req.session.error_msg = "Failed to fetch banner.";
      res.redirect("/admin/banner");
    }
  }

  // Update a banner
  async updateBanner(req, res) {
    try {
      const { title, description } = req.body;
      const Bannerimage = req.file ? req.file.path : req.body.existingImage;
  
      const updateData = { title, description, Bannerimage };
  
      await Banner.findByIdAndUpdate(req.params.id, updateData);
  
      // Delete the old image if a new one is uploaded
      if (req.file && req.body.existingImage) {
        const imagePath = path.resolve(__dirname, "..", "..", "public", req.body.existingImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
  
      req.session.success_msg = "Banner updated successfully.";
      res.redirect("/admin/banner");
    } catch (error) {
      console.error("Error updating banner:", error);
      req.session.error_msg = "Failed to update banner.";
      res.redirect(`/admin/banner/edit/${req.params.id}`);
    }
  }

  // Delete a banner
  async deleteBanner(req, res) {
    try {
      await Banner.findByIdAndDelete(req.params.id);
      req.session.success_msg = "Banner deleted successfully.";
      res.redirect("/admin/banner");
    } catch (error) {
      console.error("Error deleting banner:", error);
      req.session.error_msg = "Failed to delete banner.";
      res.redirect("/admin/banner");
    }
  }
}

module.exports = new BannerController();
