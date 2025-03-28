const { check, validationResult } = require("express-validator");

// Shared validation patterns (keeping them consistent with schema)
const URL_PATTERN = /^(https?:\/\/)?([\da-z\.-]+)(\.[a-z\.]{2,6})?([\/\w \.-]*)*\/?$/;
const PHONE_PATTERN = /^\+?[\d\s-]{10,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Custom validators
const validatePhoneNumber = (value) => {
  if (!PHONE_PATTERN.test(value)) {
    throw new Error("Invalid phone number");
  }
  return true;
};

const validateURL = (value) => {
  if (!URL_PATTERN.test(value)) {
    throw new Error("Invalid URL format");
  }
  return true;
};

// Validation middleware
const validateCompanyApproval = [
  check("student").notEmpty().withMessage("Student ID is required"),
  
  check("studentName").notEmpty().withMessage("Student name is required"),
  
  check("companyName").notEmpty().withMessage("Company name is required"),
  
  check("companyWebsite")
    .notEmpty().withMessage("Company website is required") // Changed to required
    .custom(validateURL)
    .withMessage("Invalid company website URL"),
  
  check("companyAddress").notEmpty().withMessage("Company address is required"),
  
  check("numberOfEmployees")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number of employees must be a positive integer"),
  
  check("branches")
    .isArray()
    .withMessage("Branches must be an array"),
  
  check("branches.*.location")
    .notEmpty()
    .withMessage("Branch location is required"),
  
  check("headOfficeAddress")
    .notEmpty()
    .withMessage("Head office address is required"),
  
  check("stipendAmount")
    .notEmpty().withMessage("Stipend amount is required")
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage("Stipend amount must be a positive number"),
  
  check("hrDetails").exists().withMessage("HR details are required"),
  
  check("hrDetails.name")
    .notEmpty()
    .withMessage("HR name is required"),
  
  check("hrDetails.phone")
    .notEmpty().withMessage("HR phone is required")
    .custom(validatePhoneNumber)
    .withMessage("Invalid phone number"),
  
  check("hrDetails.email")
    .notEmpty().withMessage("HR email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  
  check("technologies")
    .isArray({ min: 1 })
    .withMessage("At least one technology is required"),
  
  check("currentProject")
    .notEmpty()
    .withMessage("Current project is required"),
  
  check("clients")
    .isArray({ min: 1 })
    .withMessage("At least one client is required"),
  
  check("sourceOfCompany")
    .notEmpty()
    .withMessage("Source of company is required"),
  
  check("reasonToChoose")
    .notEmpty()
    .withMessage("Reason to choose this company is required"),
  
  // Handle validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];

module.exports = validateCompanyApproval;