// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  updateStudentName,
  deleteStudent,
  changePassword,
  fetchStudent,
  restoreStudent,
} = require("../controllers/studentController");
const {validateToken, checkRoleAccess } = require("../middleware/authMiddleware");
const validateStudentInput = require("../middleware/validateStudentInput");

// Create a student
router.post("/", checkRoleAccess(["admin"]), validateStudentInput, createStudent);

// Get all students
router.get("/", validateToken, checkRoleAccess(["admin"]), getAllStudents);

// Get student by ID
router.get("/:id", validateToken, checkRoleAccess(["student", "guide", "admin"]), getStudentById);

// Update student
router.put("/:id", validateToken, checkRoleAccess(["student", "admin"]), validateStudentInput, updateStudent);

// Soft delete student
router.delete("/:id", validateToken, checkRoleAccess(["admin"]), deleteStudent);

// PATCH /api/students/:id
router.patch("/:id", validateToken, checkRoleAccess(["student"]), updateStudentName);

// Route for changing password
router.patch("/change-password/:id", validateToken, checkRoleAccess(["student"]), changePassword);

// Fetch student by studentId and semester
router.post("/fetch-student", validateToken, checkRoleAccess(["admin"]), fetchStudent);

// Restore a soft-deleted student
router.patch("/restore/:id", validateToken, checkRoleAccess(["admin"]), restoreStudent);

module.exports = router;

