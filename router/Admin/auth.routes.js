const express = require('express');
const router = express.Router();

const authController = require('../../controller/admin/auth.controlller');


router.post('/login',authController.login);
router.get('/logout',authController.logout);


module.exports = router