const express = require("express");
const router = express.Router();
const {
  getAllCompanyApprovals,
  getCompanyApprovalById,
  createCompanyApproval,
  updateCompanyApproval,
  deleteCompanyApproval,
  updateApprovalStatus,
  restoreCompanyApproval,
} = require("../controllers/companyApprovalController");
const validateCompanyApproval = require("../middleware/validateCompanyApproval"); // Import the validation middleware
const { validateToken, checkRoleAccess } = require("../middleware/authMiddleware");

// Apply validation middleware to POST & PUT routes
router.post("/", validateToken, checkRoleAccess(["student"]), validateCompanyApproval, createCompanyApproval);
router.put("/:id", validateToken, checkRoleAccess(["student", "admin"]), validateCompanyApproval, updateCompanyApproval);

// GET all approvals
router.get("/", validateToken, checkRoleAccess(["admin"]), getAllCompanyApprovals);

// GET single approval by ID
router.get("/:id", validateToken, checkRoleAccess(["student", "guide", "admin"]), getCompanyApprovalById);

// DELETE remove an approval
router.delete("/:id", validateToken, checkRoleAccess(["student", "admin"]), deleteCompanyApproval);

// PATCH route to update approval status
router.patch("/:id", validateToken, checkRoleAccess(["admin"]), updateApprovalStatus);

// Restore an approval
router.patch("/:id/restore", validateToken, checkRoleAccess(["student", "admin"]), restoreCompanyApproval);

module.exports = router;
