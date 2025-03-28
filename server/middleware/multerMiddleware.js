const multer = require("multer");
const path = require("path");
const fs = require("fs");

const handleMulterErrors = (err, req, res, next) => {
  if (err) {
    // Handle Multer errors
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (e.g., file size exceeded)
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    } else {
      // Other errors (e.g., invalid file type)
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
  // If no error, proceed to the next middleware
  next();
};

// Create the "uploads" directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext); // Generate unique filenames
  },
});

// File filter to allow specific file types (PDF, JPEG, PNG)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only PDF, JPEG, and PNG files are allowed"), false); // Reject the file
  }
};

// Initialize Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

module.exports = {upload, handleMulterErrors};