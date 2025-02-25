const about = require("../../model/about");
const fs = require("fs");
const path = require("path");

class AboutController {
  // Get all about sections
  async getAllAbout(req, res) {
    try {
      const abouts = await about.About.find();
      req.session.success_msg = req.flash("success_msg");
      req.session.error_msg = req.flash("error_msg");
      res.render("Admin/About", { abouts });
    } catch (error) {
      console.error("Error fetching about sections:", error);
      req.session.error_msg = "Failed to fetch about sections.";
      res.redirect("/admin/about");
    }
  }

  // Render the form to create a new about section
  async createAboutForm(req, res) {
    const abouts = await about.About.find();
    res.render("Admin/createabout", { abouts });
  }

  // Create a new about section
  async createAbout(req, res) {
    try {
      const { title, description } = req.body;
      const Aboutimage = req.file ? req.file.path : null;
      console.log(Aboutimage);

      if (!title || !description || !Aboutimage) {
        req.session.error_msg = "All fields are required.";
        return res.redirect("/admin/about/create");
      }

      await about.About.create({ title, description, Aboutimage });
      req.session.success_msg = "About section created successfully.";
      res.redirect("/admin/about");
    } catch (error) {
      console.error("Error creating about section:", error);
      req.session.error_msg = "Failed to create about section.";
      res.redirect("/admin/about/create");
    }
  }

  // Render the edit form for an about section
  async editAboutForm(req, res) {
    try {
      const abouts = await about.About.findById(req.params.id);
      if (!abouts) {
        req.session.error_msg = "About section not found.";
        return res.redirect("/admin/about");
      }
      res.render("Admin/updateabout", { abouts });
    } catch (error) {
      console.error("Error fetching about section:", error);
      req.session.error_msg = "Failed to fetch about section.";
      res.redirect("/admin/about");
    }
  }

  // Update an about section
  async updateAbout(req, res) {
    try {
      const { title, description } = req.body;
      const Aboutimage = req.file ? req.file.path : req.body.existingImage;

      const updateData = { title, description, Aboutimage };

      await about.About.findByIdAndUpdate(req.params.id, updateData);
      
      // Delete old image if a new one is uploaded
      if (req.file) {
        const imagePath = path.resolve(req.body.existingImage);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      req.session.success_msg = "About section updated successfully.";
      res.redirect("/admin/about");
    } catch (error) {
      console.error("Error updating about section:", error);
      req.session.error_msg = "Failed to update about section.";
      res.redirect(`/admin/about/edit/${req.params.id}`);
    }
  }

  // Delete an about section
  async deleteAbout(req, res) {
    try {
      const abouts = await about.About.findById(req.params.id);
      if (!abouts) {
        req.session.error_msg = "About section not found.";
        return res.redirect("/admin/about");
      }

      // Delete image file from storage
      const imagePath = path.resolve(abouts.Aboutimage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

      await about.About.findByIdAndDelete(req.params.id);

      req.session.success_msg = "About section deleted successfully.";
      res.redirect("/admin/about");
    } catch (error) {
      console.error("Error deleting about section:", error);
      req.session.error_msg = "Failed to delete about section.";
      res.redirect("/admin/about");
    }
  }
}

module.exports = new AboutController();
