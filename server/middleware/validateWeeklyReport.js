const { body } = require("express-validator");

const validateReport = [
  body("projectTitle").notEmpty().withMessage("Project Title is required"),
  body("reportWeek")
    .isInt({ min: 1, max: 4 })
    .withMessage("Report Week must be between 1 and 4"),
  body("reportWeekStart")
    .isISO8601()
    .withMessage("Valid start date required (YYYY-MM-DD)"),
  body("reportWeekEnd")
    .isISO8601()
    .withMessage("Valid end date required (YYYY-MM-DD)"),
  body("objectivesForWeek")
    .notEmpty()
    .withMessage("Objectives for the week are required"),
  body("tasksCompleted")
    .notEmpty()
    .withMessage("Tasks completed are required"),
  body("keyFindings").notEmpty().withMessage("Key findings are required"),
  body("challengesEncountered")
    .notEmpty()
    .withMessage("Challenges encountered are required"),
  body("planForNextWeek")
    .notEmpty()
    .withMessage("Plan for next week is required"),
];

module.exports = validateReport;