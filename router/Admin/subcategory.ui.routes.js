const express = require('express');
const router = express.Router();
const { Subcategory } = require('../../model/category');

const subcategoryUiController = require('../../controller/admin/subcategory.ui.controller');
const subcategoryupload = require('../../multer/subcategory.multer');
const { AdminauthMiddleware } = require('../../middleware/Auth');

router.get('/',AdminauthMiddleware,subcategoryUiController.getAllSubcategories)
router.get('/create',AdminauthMiddleware,subcategoryUiController.createSubcategoryForm)
router.post('/add',AdminauthMiddleware,subcategoryupload.single('subcategoryImage'),subcategoryUiController.createSubcategory)
router.get('/edit/:id',AdminauthMiddleware,subcategoryUiController.editSubcategoryForm)
router.post('/update/:id',AdminauthMiddleware,subcategoryUiController.updateSubcategory)
router.get('/delete/:id',AdminauthMiddleware,subcategoryUiController.deleteSubcategory)
// const express = require("express");



// Route to fetch subcategories based on category ID
router.get("/get-subcategories/:categoryId", AdminauthMiddleware,async (req, res) => {
    try {
        const subcategories = await Subcategory.find({ category: req.params.categoryId });
        res.json(subcategories);  // Send only relevant subcategories
    } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
module.exports = router