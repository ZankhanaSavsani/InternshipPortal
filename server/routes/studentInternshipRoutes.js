const express = require("express");
const router = express.Router();
const {
  addWeeklyReport,
  addCompanyApprovalDetails,
  addSummerInternshipStatus,
  addSummerInternshipCompletionStatus,
  updateGuide,
  getStudentInternshipByStudentIdAndSemester,
} = require("../controllers/studentInternshipController");
const {validateToken, checkRoleAccess } = require("../middleware/authMiddleware");

// Add a weekly report
router.post("/:id/weekly-reports", validateToken, checkRoleAccess(["student"]), addWeeklyReport);

// Add company approval details
router.post("/:id/company-approvals", validateToken, checkRoleAccess(["student"]), addCompanyApprovalDetails);

// Add summer internship status
router.post("/:id/summer-internship-status", validateToken, checkRoleAccess(["student"]), addSummerInternshipStatus);

// Add summer internship completion status
router.post(
  "/:id/summer-internship-completion-status",
  validateToken,
  checkRoleAccess(["student"]),
  addSummerInternshipCompletionStatus
);

// Update the guide for a student internship record
router.put("/:id/update-guide", validateToken, checkRoleAccess(["admin"]), updateGuide);

// Fetch Student Internship Data by Student ID and Semester
router.get(
  "/student/:studentId",
  validateToken,
  checkRoleAccess(["admin"]),
  getStudentInternshipByStudentIdAndSemester
);


module.exports = router;
