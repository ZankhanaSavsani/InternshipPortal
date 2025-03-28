const { body, validationResult } = require("express-validator");

const validateStudentInput = [
  body("studentId")
    .trim()
    .notEmpty().withMessage("Student ID is required")
    .isLength({ min: 3, max: 20 }).withMessage("Student ID must be between 3 and 20 characters"),

  body("semester")
    .trim()
    .notEmpty().withMessage("Semester is required")
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be a number between 1 and 8"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = validateStudentInput;
