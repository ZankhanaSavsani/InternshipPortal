// routes/adminRoutes.js
const express = require("express");
const {
  validateToken,
  checkRoleAccess,
} = require("../middleware/authMiddleware");
const validateAdminInput = require("../middleware/validateAdminInput");
const router = express.Router();
const {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllAdmins,
  getAdminById,
  changePassword,
  fetchAdmin,
  restoreAdmin
} = require("../controllers/adminController");

// Create a new admin
router.post(
  "/",
  validateToken,
  checkRoleAccess(["admin"]),
  validateAdminInput,
  createAdmin
);

// Update an existing admin by ID
router.put(
  "/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  validateAdminInput,
  updateAdmin
);

// Soft delete an admin by ID
router.delete(
  "/:id", 
  validateToken, 
  checkRoleAccess(["admin"]), 
  deleteAdmin
);

// Restore a soft-deleted admin by ID
router.patch(
  "/restore/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  restoreAdmin
);

// Get all admins (excluding soft-deleted records)
router.get(
  "/",
  validateToken,
  checkRoleAccess(["admin"]),
  getAllAdmins
);

// Get admin by ID
router.get(
  "/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  getAdminById
);

// Fetch admin by email
router.get(
  "/fetch",
  validateToken,
  checkRoleAccess(["admin"]),
  fetchAdmin
);

// Route for changing password
router.patch(
  "/change-password/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  changePassword
);

module.exports = router;