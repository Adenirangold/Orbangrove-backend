const express = require("express");
const shopController = require("../controllers/shopController");

const router = express.Router();

router.get("/products", shopController.getAllProducts);

module.exports = router;
