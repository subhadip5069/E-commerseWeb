const express = require('express');
const router = express.Router();

const filterProductController = require('../../controller/ui/filterration');

router.get('/',filterProductController.searchProducts);
router.get('/filter',filterProductController.getFilteredProducts);

module.exports = router