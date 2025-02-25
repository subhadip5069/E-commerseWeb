const express = require("express")

const router = express.Router()

const aboutUiController = require("../../controller/admin/about.ui.controller")
const aboutupload = require("../../multer/about.multer")
const { AdminauthMiddleware } = require("../../middleware/Auth")

router.get('/',AdminauthMiddleware,aboutUiController.getAllAbout)
router.get('/create',AdminauthMiddleware,aboutUiController.createAboutForm)
router.post('/add',AdminauthMiddleware,aboutupload.single('Aboutimage'),aboutUiController.createAbout)  
router.get('/edit/:id',AdminauthMiddleware,aboutUiController.editAboutForm)
router.post('/update/:id',AdminauthMiddleware,aboutupload.single('Aboutimage'),aboutUiController.updateAbout)
router.get('/delete/:id',AdminauthMiddleware,aboutUiController.deleteAbout)

module.exports = router