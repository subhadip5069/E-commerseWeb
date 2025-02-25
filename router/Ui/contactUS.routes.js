const express = require('express');
const router = express.Router();

const contactUiController = require('../../controller/ui/contactus.routes');
const {authMiddleware}= require('../../middleware/Auth');

router.post('/create',authMiddleware,contactUiController.createContact)

module.exports = router