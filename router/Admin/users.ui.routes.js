const express = require("express");
const router = express.Router();

const userUiController = require('../../controller/admin/user.ui.controller');
const { AdminauthMiddleware } = require("../../middleware/Auth");

// router.get('/single',userUiController.getUser)
router.get('/',AdminauthMiddleware,userUiController.getalluser)
router.post('/status/:userId',AdminauthMiddleware,userUiController.updateUserStatus)

module.exports = router