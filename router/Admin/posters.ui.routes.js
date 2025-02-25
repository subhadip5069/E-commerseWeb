const express = require('express');
const router = express.Router();

const purchaseUiController = require('../../controller/admin/poster.ui.controller');
const posterupload = require('../../multer/poster.multer');
const { route } = require('./subcategory.ui.routes');
const { AdminauthMiddleware } = require('../../middleware/Auth');

router.get('/',AdminauthMiddleware,purchaseUiController.getAllPosters)
router.post('/add',AdminauthMiddleware,posterupload.single('Posterimage'),purchaseUiController.addPoster)
router.get("/create",AdminauthMiddleware, purchaseUiController.createposter);
router.get('/edit/:id',AdminauthMiddleware,purchaseUiController.editposter)
router.post('/update/:id',AdminauthMiddleware,posterupload.single('Posterimage'),purchaseUiController.updatePoster)
router.get('/delete/:id',AdminauthMiddleware,purchaseUiController.deletePoster)

module.exports = router