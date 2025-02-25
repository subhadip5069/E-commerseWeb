const express = require('express');
const router = express.Router();

const bannerUiController = require('../../controller/admin/banner.ui.controller');
const bannerupload = require('../../multer/banner.multer');
const { AdminauthMiddleware } = require('../../middleware/Auth');

router.get('/',AdminauthMiddleware,bannerUiController.getAllBanners)
router.get('/create',AdminauthMiddleware,bannerUiController.createBannerForm)
router.post('/add',AdminauthMiddleware,bannerupload.single('Bannerimage'),bannerUiController.createBanner)
router.get('/edit/:id',AdminauthMiddleware,bannerUiController.editBannerForm)
router.post('/update/:id',AdminauthMiddleware,bannerupload.single('Bannerimage'),bannerUiController.updateBanner)
router.get('/delete/:id',AdminauthMiddleware,bannerUiController.deleteBanner)

module.exports = router