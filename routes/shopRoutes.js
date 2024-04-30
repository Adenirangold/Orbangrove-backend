const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

router.get("/products");
router.get("/category", categoryController.getAllCategory);

router.post("/category", categoryController.createCategory);

module.exports = router;
