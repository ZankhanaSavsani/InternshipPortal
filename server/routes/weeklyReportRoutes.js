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
// Create a new weekly report
router.post(
  "/",
  validateToken,
  checkRoleAccess(["student"]),
  validateReport,
  createWeeklyReport
);
// Get all weekly reports
router.get("/", validateToken, checkRoleAccess(["admin"]), getAllWeeklyReports);
// Get a single weekly report by ID
router.get(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "admin"]),
  getWeeklyReportById
);
// Update a weekly report
router.put(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "admin"]),
  validateReport,
  updateWeeklyReport
);
// Delete a weekly report
router.delete(
  "/:id",
  validateToken,
  checkRoleAccess(["admin"]),
  deleteWeeklyReport
);
// Update approval status and rejection reason
router.patch(
  "/:id/approval",
  validateToken,
  checkRoleAccess(["admin"]),
  updateApprovalStatus
);
// Add marks to a weekly report
router.patch(
  "/:id/marks",
  validateToken,
  checkRoleAccess(["admin"]),
  addMarks
);
// Restore a soft-deleted weekly report
router.patch(
  "/:id/restore",
  validateToken,
  checkRoleAccess(["admin"]),
  restoreWeeklyReport
);

// Get all weekly reports for students assigned to the guide
router.get(
  "/guide",
  validateToken,
  checkRoleAccess(["guide"]),
  getGuideWeeklyReports
);

// Get a single weekly report for a student assigned to the guide
router.get(
  "/guide/:id",
  validateToken,
  checkRoleAccess(["guide"]),
  getGuideWeeklyReportById
);

// Update approval status for a weekly report
router.patch(
  "/guide/:id/approval",
  validateToken,
  checkRoleAccess(["guide"]),
  updateGuideApprovalStatus
);

// Add marks to a weekly report
router.patch(
  "/guide/:id/marks",
  validateToken,
  checkRoleAccess(["guide"]),
  addGuideMarks
);

module.exports = router;
