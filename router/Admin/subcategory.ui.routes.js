const express = require('express');
const router = express.Router();

const subcategoryUiController = require('../../controller/admin/subcategory.ui.controller');

router.get('/',subcategoryUiController.getAllSubcategories)
router.get('/create',subcategoryUiController.createSubcategoryForm)
router.post('/add',subcategoryUiController.createSubcategory)
router.get('/edit/:id',subcategoryUiController.editSubcategoryForm)
router.post('/update/:id',subcategoryUiController.updateSubcategory)
router.get('/delete/:id',subcategoryUiController.deleteSubcategory)

module.exports = router