const express = require("express")

const router = express.Router()

const adminUiController = require("../../controller/admin/admin.ui.controller")

router.get('/',adminUiController.login)
router.get('/dashboard',adminUiController.dashboard)
// router.get('/category',adminUiController.getCategoryWithSubcategories)


module.exports = router