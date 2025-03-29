const express = require("express");
const {
  createWeeklyReport,
  getAllWeeklyReports,
  getWeeklyReportById,
  updateWeeklyReport,
  deleteWeeklyReport,
  updateApprovalStatus,
  addMarks,
  restoreWeeklyReport,
  getGuideWeeklyReports,
  getGuideWeeklyReportById,
  updateGuideApprovalStatus,
  addGuideMarks
} = require("../controllers/WeeklyReportController");

const validateReport = require("../middleware/validateWeeklyReport");
const {
  validateToken,
  checkRoleAccess,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
// Create a new weekly report (Student only)
router.post(
  "/",
  validateToken,
  checkRoleAccess(["student"]),
  validateReport,
  createWeeklyReport
);

// Get all weekly reports (Admin only)
router.get("/", validateToken, checkRoleAccess(["admin"]), getAllWeeklyReports);

// Get a single weekly report by ID (Student who owns it or Admin)
router.get(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "admin"]),
  getWeeklyReportById
);

// Update a weekly report (Student who owns it or Admin)
router.put(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "admin"]),
  validateReport,
  updateWeeklyReport
);

// Delete a weekly report (Admin only)
router.delete(
  "/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  deleteWeeklyReport
);

// Update approval status (Admin only - sends notification to student)
router.patch(
  "/:id/approval",
  validateToken,
  checkRoleAccess(["admin"]),
  updateApprovalStatus
);

// Add marks (Admin only - sends notification to student)
router.patch(
  "/:id/marks",
  validateToken,
  checkRoleAccess(["admin"]),
  addMarks
);

// Restore a soft-deleted weekly report (Admin only)
router.patch(
  "/:id/restore",
  validateToken,
  checkRoleAccess(["admin"]),
  restoreWeeklyReport
);

// Guide-specific routes -----------------------------------------------------

// Get all weekly reports for assigned students (Guide only)
router.get(
  "/guide/reports",
  validateToken,
  checkRoleAccess(["guide"]),
  getGuideWeeklyReports
);

// Get a single weekly report for assigned student (Guide only)
router.get(
  "/guide/reports/:id",
  validateToken,
  checkRoleAccess(["guide"]),
  getGuideWeeklyReportById
);

// Update approval status (Guide only - sends notification to student)
router.patch(
  "/guide/reports/:id/approval",
  validateToken,
  checkRoleAccess(["guide"]),
  updateGuideApprovalStatus
);

// Add marks (Guide only - sends notification to student)
router.patch(
  "/guide/reports/:id/marks",
  validateToken,
  checkRoleAccess(["guide"]),
  addGuideMarks
);

module.exports = router;