const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get(
  "/product",
  authController.protectRoutes,
  adminController.getProducts
);
router.post(
  "/product",
  authController.protectRoutes,
  adminController.createProduct
);
router.patch(
  "/product/:productId",
  authController.protectRoutes,
  adminController.editProduct
);
router.delete(
  "/product/:productId",
  authController.protectRoutes,
  adminController.deleteProduct
);

module.exports = router;
