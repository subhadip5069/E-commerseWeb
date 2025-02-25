const express = require("express")

const router = express.Router()

const aboutUiController = require("../../controller/admin/about.ui.controller")
const aboutupload = require("../../multer/about.multer")

router.get('/',aboutUiController.getAllAbout)
router.get('/create',aboutUiController.createAboutForm)
router.post('/add',aboutupload.single('Aboutimage'),aboutUiController.createAbout)  
router.get('/edit/:id',aboutUiController.editAboutForm)
router.post('/update/:id',aboutupload.single('Aboutimage'),aboutUiController.updateAbout)
router.get('/delete/:id',aboutUiController.deleteAbout)

module.exports = router