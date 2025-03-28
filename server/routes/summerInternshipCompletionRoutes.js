const express = require("express");
const router = express.Router();
const multer = require("multer");
const validateInternshipCompletionStatus = require("../middleware/validateInternshipCompletionStatus");
const {
  createInternshipCompletionStatus,
  getAllInternshipCompletionStatuses,
  getInternshipCompletionStatusById,
  updateInternshipCompletionStatus,
  deleteInternshipCompletionStatus,
  restoreInternshipCompletionStatus
} = require("../controllers/summerInternshipCompletionController");
const { validateToken, checkRoleAccess } = require("../middleware/authMiddleware");
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files
const {handleMulterErrors} = require("../middleware/multerMiddleware");

// File validation middleware
const validateFiles = (req, res, next) => {
  if (!req.files?.completionCertificate?.[0]) {
    return res.status(400).json({
      success: false,
      message: "Completion certificate is required",
    });
  }

  if (req.files?.stipendProof?.[0]) {
    const stipendProof = req.files.stipendProof[0];
    if (!stipendProof.mimetype.startsWith("image/") && !stipendProof.mimetype.startsWith("application/pdf")) {
      return res.status(400).json({
        success: false,
        message: "Stipend proof must be an image or PDF file",
      });
    }
  }

  next();
};

// Create internship completion status
router.post(
  "/",
  validateToken,
  checkRoleAccess(["student"]),
  upload.fields([
    { name: "stipendProof", maxCount: 1 },
    { name: "completionCertificate", maxCount: 1 },
  ]),
  handleMulterErrors,
  validateFiles,
  validateInternshipCompletionStatus,
  createInternshipCompletionStatus
);

// Update an internship completion status by ID
router.put(
  "/:id",
  upload.fields([
    { name: "stipendProof", maxCount: 1 },
    { name: "completionCertificate", maxCount: 1 },
  ]),
  validateToken,
  validateInternshipCompletionStatus,
  updateInternshipCompletionStatus
);

// Get all internship completion statuses
router.get("/", validateToken, checkRoleAccess(["admin"]), getAllInternshipCompletionStatuses);

// Get a specific internship completion status by ID
router.get(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "guide", "admin"]),
  getInternshipCompletionStatusById
);

// Delete an internship completion status by ID
router.delete(
  "/:id",
  validateToken,
  checkRoleAccess(["student", "admin"]),
  deleteInternshipCompletionStatus
);

// New route for restoring soft-deleted data
router.patch("/:id/restore", validateToken, checkRoleAccess(["admin"]), restoreInternshipCompletionStatus);


module.exports = router;
