const express = require('express');
const router = express.Router();

const bannerUiController = require('../../controller/admin/banner.ui.controller');
const bannerupload = require('../../multer/banner.multer');

router.get('/',bannerUiController.getAllBanners)
router.get('/create',bannerUiController.createBannerForm)
router.post('/add',bannerupload.single('Bannerimage'),bannerUiController.createBanner)
router.get('/edit/:id',bannerUiController.editBannerForm)
router.post('/update/:id',bannerupload.single('Bannerimage'),bannerUiController.updateBanner)
router.get('/delete/:id',bannerUiController.deleteBanner)

module.exports = router