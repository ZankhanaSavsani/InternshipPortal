const express = require("express");
const router = express.Router();
const {upload , handleMulterErrors} = require("../middleware/multerMiddleware");
const {
  getAllInternshipStatuses,
  getInternshipStatusById,
  createInternshipStatus,
  updateInternshipStatus,
  deleteInternshipStatus,
  restoreInternshipStatus,
} = require("../controllers/summerInternshipStatusController");
const { validateToken, checkRoleAccess } = require("../middleware/authMiddleware");
const { validateInternshipStatus} = require("../middleware/validateInternshipStatusMiddleware");

const validateFiles = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "offer Letter is required",
    });
  }

  next();
};


// Apply Multer middleware for file uploads
router.post(
  "/",
  validateToken,
  checkRoleAccess(["student"]),
  upload.single("offerLetter"), // Handle single file upload
  handleMulterErrors,
  validateFiles,
  validateInternshipStatus,
  createInternshipStatus
);

router.put(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "admin"]),
  upload.single("offerLetter"), // Handle single file upload
  validateInternshipStatus,
  updateInternshipStatus
);

// GET all internship statuses
router.get("/", validateToken, checkRoleAccess(["admin"]), getAllInternshipStatuses);

// GET single internship status by ID
router.get("/:id", validateToken, checkRoleAccess(["student", "guide", "admin"]), getInternshipStatusById);

// DELETE remove an internship status
router.delete("/:id", validateToken, checkRoleAccess(["student", "admin"]), deleteInternshipStatus);

// New route for restoring soft-deleted data
router.patch("/:id/restore", validateToken, checkRoleAccess(["admin"]), restoreInternshipStatus);

module.exports = router;