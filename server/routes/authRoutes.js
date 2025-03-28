// routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const { validateToken } = require("../middleware/authMiddleware"); // Import token validation middleware
const router = express.Router();

// Login route
router.post("/login", authController.login);

// Refresh token route
router.post("/refresh-token", authController.refreshToken);

// Logout route
router.post("/logout", authController.logout);

// Get user by ID route (protected by token validation)
router.get("/users/:id", validateToken, authController.getUserById);

// Get logged-in user details (protected by token validation)
router.get("/me", validateToken, authController.getMe);


module.exports = router;