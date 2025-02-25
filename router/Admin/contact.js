const express = require('express');
const router = express.Router();

const contactUiController = require('../../controller/admin/contact.ui.controller');
const { AdminauthMiddleware } = require('../../middleware/Auth');

router.get('/',AdminauthMiddleware,contactUiController.getContact)

module.exports = router