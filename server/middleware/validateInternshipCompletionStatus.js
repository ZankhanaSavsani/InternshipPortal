const { check, validationResult } = require("express-validator");

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

const validateInternshipCompletionStatus = [
  // Student Details
  check("student")
    .trim()
    .notEmpty()
    .withMessage("Student ID is required")
    .isMongoId()
    .withMessage("Invalid Student ID format"),

  check("studentName")
    .trim()
    .notEmpty()
    .withMessage("Student name is required"),

  // Company Details
  check("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),

  check("companyWebsite")
    .trim()
    .notEmpty()
    .withMessage("Company website is required")
    .isURL()
    .withMessage("Invalid company website URL"),

  check("companyAddress")
    .trim()
    .notEmpty()
    .withMessage("Company address is required"),

  // Internship Details
  check("typeOfInternship")
    .trim()
    .notEmpty()
    .withMessage("Internship type is required")
    .isIn([
      "Development Project",
      "Inhouse/Research Project",
      "On Technology Training",
    ])
    .withMessage(
      "Invalid internship type. Must be one of: Development Project, Inhouse/Research Project, On Technology Training"
    ),

  check("technologies")
    .trim()
    .custom((value) => {
      if (typeof value === "string") {
        return value.split(",").map((tech) => tech.trim());
      }
      return Array.isArray(value);
    })
    .withMessage("Technologies must be an array or a comma-separated string"),

  check("technologiesDetails")
    .trim()
    .notEmpty()
    .withMessage("Technologies details are required"),

  check("modeOfInternship")
    .trim()
    .notEmpty()
    .withMessage("Mode of internship is required")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage(
      "Invalid mode of internship. Must be one of: Offline, Online, Hybrid"
    ),

  // Internship Duration
  check("startDate")
    .trim()
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be in YYYY-MM-DD format"),

  check("endDate")
    .trim()
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be in YYYY-MM-DD format")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error("End date must be after the start date");
      }
      return true;
    }),

  // HR Contact Details
  check("hrDetails.name").trim().notEmpty().withMessage("HR name is required"),

  check("hrDetails.phone")
    .trim()
    .notEmpty()
    .withMessage("HR phone number is required")
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage("Invalid phone number format"),

  check("hrDetails.email")
    .trim()
    .notEmpty()
    .withMessage("HR email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  // Financial & Completion Documents
  check("stipendAmount")
    .trim()
    .notEmpty()
    .withMessage("Stipend amount is required")
    .isFloat({ min: 0 })
    .withMessage("Stipend amount must be a positive number"),

  // Conditional validation for stipendProof
  check("stipendProof")
    .optional() // Make it optional by default
    .custom((value, { req }) => {
      const stipendAmount = parseFloat(req.body.stipendAmount);
      if (stipendAmount > 0 && !value) {
        throw new Error("Stipend proof is required when stipend amount is greater than zero");
      }
      return true;
    }),
    
  // Middleware to handle validation results
  (req, res, next) => {
    if (req.body.technologies && typeof req.body.technologies === "string") {
      req.body.technologies = req.body.technologies.split(",").map((tech) => tech.trim());
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log the received values for debugging
      console.log("Received values:", req.body);

      return res.status(400).json({
        errors: errors.array().map((error) => ({
          ...error,
          receivedValue: req.body[error.path], // Include the received value in the error
        })),
      });
    }
    next();
  },
];

module.exports = validateInternshipCompletionStatus;
