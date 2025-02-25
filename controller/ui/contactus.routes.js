const Contact = require("../../model/contact");


class contactController{
    createContact = async (req, res) => {
        try {
            const { name, email, message,subject } = req.body;
            const contact = new Contact({
                name,
                email,
                message,
                subject
            });
            await contact.save();

            req.session.success_msg = "Message sent successfully!";


            res.redirect("/contactus");
        } catch (error) {
            console.error(error);
            req.session.error_msg = "Failed to send message.";
            res.redirect("/contactus");
        }
    }
}

module.exports = new contactController();