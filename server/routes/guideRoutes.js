// routes/guideRoutes.js
const express = require("express");
const router = express.Router();
const {
  createGuide,
  updateGuide,
  deleteGuide,
  getGuideById,
  getAllGuides,
  fetchGuideByEmail,
  restoreGuide,
} = require("../controllers/guideController");
const {validateToken, checkRoleAccess } = require("../middleware/authMiddleware");
const validateGuideInput = require("../middleware/validateGuideInput");

// Create a new guide
router.post("/", validateToken, checkRoleAccess(["admin"]), validateGuideInput, createGuide);

// Update an existing guide by ID
router.put("/:id", validateToken, checkRoleAccess(["guide", "admin"]), validateGuideInput, updateGuide);

// Soft delete a guide by ID
router.delete("/:id", validateToken, checkRoleAccess(["admin"]), deleteGuide);

// Get a single guide by ID
router.get("/:id", validateToken, checkRoleAccess(["guide", "admin"]), getGuideById);

// Get all guides (excluding soft-deleted records)
router.get("/", validateToken, checkRoleAccess(["admin"]), getAllGuides);

// Add this near your other routes
router.get("/fetch/by-email", validateToken, checkRoleAccess(["admin"]), fetchGuideByEmail);

// Add this before your PATCH route
router.options('/restore/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Your existing route
router.patch("/restore/:id", validateToken, checkRoleAccess(["admin"]), restoreGuide);

module.exports = router;
