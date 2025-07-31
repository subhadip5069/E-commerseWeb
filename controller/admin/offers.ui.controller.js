const Offers = require("../../model/offers");
const HeroBanner = require("../../model/heroBanner");

class OffersController {
    
    // Display all offers
    index = async (req, res) => {
        try {
            const offers = await Offers.find().sort({ createdAt: -1 });
            res.render('Admin/offers', { 
                offers,
                title: "Manage Offers",
                messages: req.flash()
            });
        } catch (error) {
            console.error("Error fetching offers:", error);
            req.flash("error_msg", "Error loading offers");
            res.redirect("/admin/dashboard");
        }
    };

    // Show create offer form
    create = (req, res) => {
        res.render('Admin/createOffers', {
            title: "Create New Offer",
            messages: req.flash()
        });
    };

    // Store new offer
    store = async (req, res) => {
        try {
            const {
                title,
                description,
                link,
                discountPercentage,
                backgroundColor,
                textColor,
                sectionType,
                validFrom,
                validTo,
                sortOrder
            } = req.body;

            const image = req.file ? req.file.path : '';

            const newOffer = new Offers({
                title,
                description,
                image,
                link: link || "#",
                discountPercentage: parseInt(discountPercentage) || 0,
                backgroundColor: backgroundColor || "#007bff",
                textColor: textColor || "#ffffff",
                sectionType: sectionType || "sale",
                validFrom: validFrom ? new Date(validFrom) : new Date(),
                validTo: validTo ? new Date(validTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                sortOrder: parseInt(sortOrder) || 0,
                isActive: true
            });

            await newOffer.save();
            req.flash("success_msg", "Offer created successfully!");
            res.redirect("/admin/offers");
        } catch (error) {
            console.error("Error creating offer:", error);
            req.flash("error_msg", "Error creating offer");
            res.redirect("/admin/offers/create");
        }
    };

    // Show edit form
    edit = async (req, res) => {
        try {
            const offer = await Offers.findById(req.params.id);
            if (!offer) {
                req.flash("error_msg", "Offer not found");
                return res.redirect("/admin/offers");
            }
            res.render('Admin/updateOffers', {
                offer,
                title: "Edit Offer",
                messages: req.flash()
            });
        } catch (error) {
            console.error("Error fetching offer:", error);
            req.flash("error_msg", "Error loading offer");
            res.redirect("/admin/offers");
        }
    };

    // Update offer
    update = async (req, res) => {
        try {
            const {
                title,
                description,
                link,
                discountPercentage,
                backgroundColor,
                textColor,
                sectionType,
                validFrom,
                validTo,
                sortOrder,
                isActive
            } = req.body;

            const updateData = {
                title,
                description,
                link: link || "#",
                discountPercentage: parseInt(discountPercentage) || 0,
                backgroundColor: backgroundColor || "#007bff",
                textColor: textColor || "#ffffff",
                sectionType: sectionType || "sale",
                validFrom: validFrom ? new Date(validFrom) : new Date(),
                validTo: validTo ? new Date(validTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                sortOrder: parseInt(sortOrder) || 0,
                isActive: isActive === "true"
            };

            if (req.file) {
                updateData.image = req.file.path;
            }

            await Offers.findByIdAndUpdate(req.params.id, updateData);
            req.flash("success_msg", "Offer updated successfully!");
            res.redirect("/admin/offers");
        } catch (error) {
            console.error("Error updating offer:", error);
            req.flash("error_msg", "Error updating offer");
            res.redirect("/admin/offers");
        }
    };

    // Delete offer
    delete = async (req, res) => {
        try {
            await Offers.findByIdAndDelete(req.params.id);
            req.flash("success_msg", "Offer deleted successfully!");
            res.redirect("/admin/offers");
        } catch (error) {
            console.error("Error deleting offer:", error);
            req.flash("error_msg", "Error deleting offer");
            res.redirect("/admin/offers");
        }
    };

    // Toggle offer status
    toggleStatus = async (req, res) => {
        try {
            const offer = await Offers.findById(req.params.id);
            if (!offer) {
                req.flash("error_msg", "Offer not found");
                return res.redirect("/admin/offers");
            }

            offer.isActive = !offer.isActive;
            await offer.save();

            req.flash("success_msg", `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully!`);
            res.redirect("/admin/offers");
        } catch (error) {
            console.error("Error toggling offer status:", error);
            req.flash("error_msg", "Error updating offer status");
            res.redirect("/admin/offers");
        }
    };

    // Hero Banner Management
    heroBanners = async (req, res) => {
        try {
            const heroBanners = await HeroBanner.find().sort({ createdAt: -1 });
            res.render('Admin/heroBanners', { 
                heroBanners,
                title: "Manage Hero Banners",
                messages: req.flash()
            });
        } catch (error) {
            console.error("Error fetching hero banners:", error);
            req.flash("error_msg", "Error loading hero banners");
            res.redirect("/admin/dashboard");
        }
    };

    // Create hero banner
    createHeroBanner = (req, res) => {
        res.render('Admin/createHeroBanner', {
            title: "Create Hero Banner",
            messages: req.flash()
        });
    };

    // Store hero banner
    storeHeroBanner = async (req, res) => {
        try {
            const {
                title,
                subtitle,
                description,
                buttonText,
                buttonLink,
                textPosition,
                overlayColor,
                textColor,
                displayType,
                sortOrder
            } = req.body;

            const image = req.file ? req.file.path : '';

            const newHeroBanner = new HeroBanner({
                title,
                subtitle: subtitle || "",
                description: description || "",
                image,
                buttonText: buttonText || "Shop Now",
                buttonLink: buttonLink || "/products",
                textPosition: textPosition || "left",
                overlayColor: overlayColor || "rgba(0,0,0,0.3)",
                textColor: textColor || "#ffffff",
                displayType: displayType || "hero",
                sortOrder: parseInt(sortOrder) || 0,
                isActive: true
            });

            await newHeroBanner.save();
            req.flash("success_msg", "Hero banner created successfully!");
            res.redirect("/admin/hero-banners");
        } catch (error) {
            console.error("Error creating hero banner:", error);
            req.flash("error_msg", "Error creating hero banner");
            res.redirect("/admin/hero-banners/create");
        }
    };
}

module.exports = new OffersController();