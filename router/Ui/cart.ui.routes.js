const express = require("express")
const router = express.Router()

const cartcontroller = require("../../controller/ui/cart.ui.controller")
const {authMiddleware} = require("../../middleware/Auth")


router.post("/create",authMiddleware,cartcontroller.addToCart )
router.get("/:id",authMiddleware,cartcontroller.removeFromCart)
router.post("/cart/update-quantity/:id",authMiddleware,cartcontroller.updateCartQuantity)


module.exports = router