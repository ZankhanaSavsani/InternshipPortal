const { body, validationResult } = require("express-validator");

const validateAdminInput = [
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 20 }).withMessage("Username must be between 3 and 20 characters"),
  
  body("adminName")
    .trim()
    .notEmpty().withMessage("Admin name is required")
    .isLength({ min: 3 }).withMessage("Admin name must be at least 3 characters long"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = validateAdminInput;
