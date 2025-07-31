const express = require("express")
const router = express.Router()

const cartcontroller = require("../../controller/ui/cart.ui.controller")
const {authMiddleware} = require("../../middleware/Auth")


router.post("/create",authMiddleware,cartcontroller.addToCart )
router.post("/remove/:id",authMiddleware,cartcontroller.removeFromCart)
router.post("/update-quantity/:id",authMiddleware,cartcontroller.updateCartQuantity)


module.exports = router