const express = require('express');
const router = express.Router();

const useruiRoutes = require('./user.ui.routes');
const authRoutes = require('./auth.routes');


router.use('/', useruiRoutes);
router.use('/', authRoutes);










module.exports = router;