const { check, validationResult } = require("express-validator");

const validateInternshipStatus = [
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

  check("companyCity")
    .trim()
    .notEmpty()
    .withMessage("Company city is required"),

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
      "Invalid type of internship. Must be one of: Development Project, Inhouse/Research Project, On Technology Training"
    ),

  check("technologies")
    .trim()
    .custom((value) => {
      if (typeof value === "string") {
        const techArray = value.split(",").map((tech) => tech.trim());
        if (techArray.length === 0) {
          throw new Error("At least one technology is required");
        }
        return techArray;
      }
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("At least one technology is required");
      }
      return true;
    })
    .withMessage("Technologies must be an array or a comma-separated string"),

  check("technologiesDetails")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Technologies details cannot be empty if provided"),

  check("modeOfInternship")
    .trim()
    .notEmpty()
    .withMessage("Mode of internship is required")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage(
      "Invalid mode of internship. Must be one of: Offline, Online, Hybrid"
    ),

  // HR Contact Details
  check("hrDetails.name").trim().notEmpty().withMessage("HR name is required"),

  check("hrDetails.phone")
    .trim()
    .notEmpty()
    .withMessage("HR phone number is required")
    .matches(/^\+?\d{10,}$/)
    .withMessage("Invalid phone number format. Must be at least 10 digits"),

  check("hrDetails.email")
    .trim()
    .notEmpty()
    .withMessage("HR email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  check("stipendAmount")
    .trim()
    .notEmpty()
    .withMessage("Stipend amount is required")
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage("Stipend amount must be a positive number"),

  (req, res, next) => {
    if (req.body.technologies && typeof req.body.technologies === "string") {
      req.body.technologies = req.body.technologies
        .split(",")
        .map((tech) => tech.trim());
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse = {
        errors: errors.array().map((error) => ({
          ...error,
          ...(process.env.NODE_ENV === "development" && {
            receivedValue: req.body[error.path], // Include the received value in development
          }),
        })),
      };
      return res.status(400).json(errorResponse);
    }
    next();
  },
];

module.exports = { validateInternshipStatus };