const express = require('express');
const app = express.Router();

const categoryUiController = require('../../controller/admin/categori.ui.controller');
const Categoryupload = require('../../multer/category.multer');
const { AdminauthMiddleware } = require('../../middleware/Auth');

app.get('/',AdminauthMiddleware,categoryUiController.getCategories)
app.post('/add',AdminauthMiddleware,Categoryupload.single('categoryImage'),categoryUiController.createCategory)
// app.get('/edit/:id',categoryUiController.editCategoryForm)
// app.post('/update/:id',Categoryupload.single('categoryImage'),categoryUiController.updateCategory)
app.get('/delete/:id',AdminauthMiddleware,categoryUiController.deleteCategory)

module.exports = app
