const fs = require("fs");
const path = require("path");
const poster = require("../../model/poster");
const Poster = require("../../model/poster");

class AdminController {
    
    // Get All Posters
    getAllPosters = async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1; // Default to page 1
            let limit = 6; // Number of posters per page
            let skip = (page - 1) * limit;
    
            const totalPosters = await Poster.countDocuments();  // Use Poster model here
            const totalPages = Math.ceil(totalPosters / limit);
    
            const posters = await Poster.find()
                .populate("usertype", "name email") // Populate user details
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
    
            req.session.success_msg = req.flash("success_msg");
            req.session.error_msg = req.flash("error_msg");
    
            res.render("Admin/posters", {
                posters,
                currentPage: page,
                totalPages,
            });
    
        } catch (error) {
            console.error("Error fetching posters:", error);
            req.flash("error_msg", "Failed to fetch posters.");
            res.redirect("/admin/poster");
        }
    };

    // Render Create Poster Page
    createposter = async (req, res) => {
        try {
            res.render("Admin/createposter");
        } catch (error) {
            console.error("Error rendering create poster page:", error);
            req.session.error_msg = "Failed to render create poster page.";
            res.redirect("/admin/poster");
        }
    };

    // Add Poster
    addPoster = async (req, res) => {
        try {
            const { title, description, usertype } = req.body;
            const prservedImage = req.file ? req.file.path : null;

            const newPoster = new Poster({
                title,
                description,
                Posterimage: prservedImage,
                usertype
            });

            await newPoster.save();
            req.session.success_msg = "Poster added successfully!";
            res.redirect("/admin/poster");
        } catch (error) {
            console.error("Error adding poster:", error);
            req.session.error_msg = "Failed to add poster.";
            res.redirect("/admin/poster");
        }
    };

    // Edit Poster
   editposter =async (req, res) => {
       try {
           const posterId = req.params.id;
           const poster = await Poster.findById(posterId);
           if (!poster) {
               req.session.error_msg = "Poster not found.";
               return res.redirect("/admin/poster");
           }
           res.render("Admin/updateposter", { poster });
       } catch (error) {
           console.error("Error rendering edit poster page:", error);
           req.session.error_msg = "Failed to render edit poster page.";
           res.redirect("/admin/poster");
       }
   }

    // Update Poster
 // Ensure the correct import
    
    updatePoster = async (req, res) => {
        try {
            const { title, description, usertype } = req.body;
            const posterId = req.params.id;
            const preservedImage = req.file ? req.file.path : null; // Ensure the file path is captured correctly
    
            console.log(preservedImage); // Debug: check the uploaded image path
            console.log(req.params.id); // Debug: check the poster ID
    
            const updateData = {
                title,
                description,
                usertype,
                Posterimage: preservedImage || req.body.existingImage // Use the existing image if no new image is uploaded
            };
    
            // If a new image is uploaded, replace the existing image
            if (req.file && req.body.existingImage) {
                const oldImagePath = path.resolve(req.body.existingImage); // Path of the old image
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath); // Delete the old image
                }
            }
    
            // Update the poster with the new data
            await Poster.findByIdAndUpdate(posterId, updateData, { new: true });
    
            req.flash('success_msg', 'Poster updated successfully');
            res.redirect('/admin/poster');
        } catch (error) {
            console.error("Error updating poster:", error);
            req.flash('error_msg', 'Error updating poster');
            res.redirect(`/admin/poster/edit/${req.params.id}`);
        }
    };
    

    // Delete Poster
    deletePoster = async (req, res) => {
        try {
            const posterId = req.params.id;
            const posterToDelete = await Poster.findById(posterId);

            if (!posterToDelete) {
                req.session.error_msg = "Poster not found.";
                return res.redirect("/admin/poster");
            }

            // Delete the image file if it exists
            if (posterToDelete.Posterimage) {
                const imagePath = path.resolve( posterToDelete.Posterimage);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            // Delete the poster from the database
            await Poster.findByIdAndDelete(posterId);

            req.session.success_msg = "Poster deleted successfully!";
            res.redirect("/admin/poster");
        } catch (error) {
            console.error("Error deleting poster:", error);
            req.session.error_msg = "Failed to delete poster.";
            res.redirect("/admin/poster");
        }
    };
}

module.exports = new AdminController();
