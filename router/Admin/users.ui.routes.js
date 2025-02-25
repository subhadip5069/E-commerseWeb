const express = require("express");
const router = express.Router();

const userUiController = require('../../controller/admin/user.ui.controller');

// router.get('/single',userUiController.getUser)
router.get('/',userUiController.getalluser)
router.post('/status/:userId',userUiController.updateUserStatus)

module.exports = router