const express = require("express");
const { verifyUser } = require("../util/verifyUser");

const cartController = require("../controllers/cartController");

const router = express.Router();

router.get("/", verifyUser, cartController.getCart);
router.post("/", verifyUser, cartController.addProductToCart);
router.delete("/:productId", verifyUser, cartController.removeProductFromCart);

module.exports = router;
