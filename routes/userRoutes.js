const express = require("express");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.get("/", authController.protectRoutes, userController.getUsers);
router.get("/:id", userController.getUser);
router.patch(
  "/updatePassword",
  authController.protectRoutes,
  authController.updatePassword
);

module.exports = router;

// /update=update user
// /delete user
