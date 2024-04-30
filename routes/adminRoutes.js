const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get(
  "/products",
  authController.protectRoutes,
  adminController.getProducts
);
router.post(
  "/products",
  authController.protectRoutes,
  adminController.createProduct
);
router.patch(
  "/products/:productId",
  authController.protectRoutes,
  adminController.editProduct
);
router.delete(
  "/products/:productId",
  authController.protectRoutes,
  adminController.deleteProduct
);

module.exports = router;
