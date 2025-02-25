const { Poster } = require("../../model/poster");

class AdminController {
    
 
    getAllPosters= async (req, res) => {
        try {
            const posters = await Poster.find();
            req.session.success_msg = req.flash("success_msg");
            req.session.error_msg = req.flash("error_msg");
            res.render("admin/posters", { posters });
        } catch (error) {
            console.error("Error fetching posters:", error);
            req.session.error_msg = "Failed to fetch posters.";
            res.redirect("/admin/posters");
        }
    }

    
    addPoster= async (req, res) => {
        try {
            const { title, description, image, userType } = req.body;

            const newPoster = new Poster({
                title,
                description,
                image,
                userType
            });

            await newPoster.save();
            req.session.success_msg = "Poster added successfully!";
            res.redirect("/admin/posters");
        } catch (error) {
            console.error("Error adding poster:", error);
            req.session.error_msg = "Failed to add poster.";
            res.redirect("/admin/posters");
        }
    }

    
    deletePoster= async (req, res) => {
        try {
            const { posterId } = req.params;
            await Poster.findByIdAndDelete(posterId);
            req.session.success_msg = "Poster deleted successfully!";
            res.redirect("/admin/posters");
        } catch (error) {
            console.error("Error deleting poster:", error);
            req.session.error_msg = "Failed to delete poster.";
            res.redirect("/admin/posters");
        }
    }
};

module.exports = new AdminController;
