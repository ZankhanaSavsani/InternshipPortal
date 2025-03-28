const express = require("express");
const { downloadData } = require("../controllers/downloadController");
const router = express.Router();
const {
  validateToken,
  checkRoleAccess,
} = require("../middleware/authMiddleware");

router.get("/download/:model", validateToken, checkRoleAccess(["admin"]), downloadData); // Accepts startDate and endDate as query params

module.exports = router;
