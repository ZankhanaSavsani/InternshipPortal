const express = require("express");
const multer = require("multer");
const {
  createInternshipCompletionStatus,
} = require("../controllers/summerInternshipCompletionController");
const validateInternshipCompletionStatus = require("../middleware/validateInternshipCompletionStatus");

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

// Route to handle form submission with file uploads
router.post(
  "/",
  upload.fields([
    { name: "stipendProof", maxCount: 1 },
    { name: "completionCertificate", maxCount: 1 },
  ]),
  validateInternshipCompletionStatus, // Apply validation middleware
  createInternshipCompletionStatus
);

module.exports = router;