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
  sendNotificationToStudents,
  sendNotificationToAllGuides
} = require("../controllers/companyApprovalController");
const validateCompanyApproval = require("../middleware/validateCompanyApproval");
const { validateToken, checkRoleAccess } = require("../middleware/authMiddleware");

// Student routes ------------------------------------------------------------

// Create a new company approval (Student only)
router.post(
  "/",
  validateToken,
  checkRoleAccess(["student"]),
  validateCompanyApproval,
  createCompanyApproval
);

// Get own company approvals (Student only)
router.get(
  "/student",
  validateToken,
  checkRoleAccess(["student"]),
  async (req, res, next) => {
    req.query.student = req.user._id; // Force filter by student's own ID
    next();
  },
  getAllCompanyApprovals
);

// Update own company approval (Student only)
router.put(
  "/student/:id",
  validateToken,
  checkRoleAccess(["student"]),
  validateCompanyApproval,
  updateCompanyApproval
);

// Delete own company approval (Student only - soft delete)
router.delete(
  "/student/:id",
  validateToken,
  checkRoleAccess(["student"]),
  deleteCompanyApproval
);

// Admin routes --------------------------------------------------------------

// Get all company approvals (Admin only)
router.get(
  "/",
  validateToken,
  checkRoleAccess(["admin"]),
  getAllCompanyApprovals
);

// Get single approval by ID (Admin only)
router.get(
  "/admin/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  getCompanyApprovalById
);

// Update any company approval (Admin only)
router.put(
  "/admin/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  validateCompanyApproval,
  updateCompanyApproval
);

// Update approval status (Admin only - sends notification to student)
router.patch(
  "/admin/:id/status",
  validateToken,
  checkRoleAccess(["admin"]),
  updateApprovalStatus
);

// Send notification to students by year/semester (Admin only)
router.post(
  "/admin/notify/students",
  validateToken,
  checkRoleAccess(["admin"]),
  sendNotificationToStudents
);

// Send notification to all guides (Admin only)
router.post(
  "/admin/notify/guides",
  validateToken,
  checkRoleAccess(["admin"]),
  sendNotificationToAllGuides
);

// Restore soft-deleted approval (Admin only)
router.patch(
  "/admin/:id/restore",
  validateToken,
  checkRoleAccess(["admin"]),
  restoreCompanyApproval
);

// Guide routes --------------------------------------------------------------

// Get company approvals for assigned students (Guide only)
router.get(
  "/guide",
  validateToken,
  checkRoleAccess(["guide"]),
  getAllCompanyApprovals
);

// Get single approval for assigned student (Guide only)
router.get(
  "/guide/:id",
  validateToken,
  checkRoleAccess(["guide"]),
  getCompanyApprovalById
);

// Shared routes -------------------------------------------------------------

// Get single approval by ID (for owner student or admin/guide with access)
router.get(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "guide", "admin"]),
  getCompanyApprovalById
);

module.exports = router;