const express = require('express');
const app = express.Router();

const categoryUiController = require('../../controller/admin/categori.ui.controller');

app.get('/',categoryUiController.getCategories)
app.post('/add',categoryUiController.createCategory)

module.exports = app
