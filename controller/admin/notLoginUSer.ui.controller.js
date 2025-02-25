const { Notloginusers } = require("../../model/notloginusers");

class NotLoginUsersController {
    // Get all records
    getAll = async (req, res)=>{
        try {
            const records = await Notloginusers.find().populate("userId", "name email");

            req.session.success_msg = req.flash("success_msg");
            req.session.error_msg = req.flash("error_msg");


            res.render("admin/notloginusers", { records });
        } catch (error) {
            console.error("Error fetching records:", error);
            req.session.error_msg = "Failed to fetch records.";
            res.redirect("/admin/notloginusers");
        }
    }

    // Add a new record
     addRecord = async (req, res) => {
        try {
            const { posters, userId } = req.body;

            const newRecord = new Notloginusers({
                posters,
                userId
            });

            await newRecord.save();
            req.session.success_msg = 'Record added successfully!';
            req.session.error_msg = 'Record added successfully!';
            res.redirect("/admin/notloginusers");
        } catch (error) {
            console.error("Error adding record:", error);
            req.session.error_msg = 'Failed to add record.';
            res.redirect("/admin/notloginusers");

        }
    }

    // Delete a record
     deleteRecord = async (req, res) => {
        try {
            const { recordId } = req.params;
            await Notloginusers.findByIdAndDelete(recordId);
            res.redirect("/admin/notloginusers");
        } catch (error) {
            console.error("Error deleting record:", error);
            res.status(500).send("Internal Server Error");
        }
    }
}

module.exports = NotLoginUsersController;
