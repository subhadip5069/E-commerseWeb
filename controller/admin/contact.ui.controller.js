const contact = require("../../model/contact");

class contactController {

     getContact = async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1; // Get the current page, default is 1
            let limit = 5; // Number of records per page
            let skip = (page - 1) * limit; // Calculate how many records to skip
    
            const totalContacts = await contact.countDocuments(); // Total number of contacts
            const totalPages = Math.ceil(totalContacts / limit); // Total number of pages
    
            const contactData = await contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    
            res.render("Admin/contacts", {
                contactData,
                currentPage: page,
                totalPages
            });
    
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    };
    
   
    
}
module.exports = new contactController();