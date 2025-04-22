const express = require("express")
const router = express.Router()
const { fetchCartController, addToCartController, removeFromCartController } = require("../controllers/Cart")

router.get("/fetchcart", fetchCartController);
router.post("/addtocart", addToCartController);
router.post("/removefromcart", removeFromCartController);

module.exports = router
