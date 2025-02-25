const express = require("express")

const router = express.Router()

const adminUiController = require("../../controller/admin/admin.ui.controller")
const { AdminauthMiddleware } = require("../../middleware/Auth")

router.get('/',adminUiController.login)
router.get('/dashboard',AdminauthMiddleware,adminUiController.dashboard)
// router.get('/category',adminUiController.getCategoryWithSubcategories)


module.exports = router