const express = require("express");
const router = express.Router();
const {
  allocateGuideToRange,
  getAllGuideAllocations,
  deleteGuideAllocation,
} = require("../controllers/guideAllocationController");
const {validateToken, checkRoleAccess } = require("../middleware/authMiddleware");
const validateRangeOverlap = require("../middleware/validateRangeOverlap");

// Allocate guide to a range of students
router.post("/allocate", validateToken, checkRoleAccess(["admin"]), validateRangeOverlap, allocateGuideToRange);

// Fetch all guide allocations
router.get("/allocations", validateToken, checkRoleAccess(["admin"]), getAllGuideAllocations);

// Delete guide allocation for a range
router.delete("/delete-guide-allocation", validateToken, checkRoleAccess(["admin"]), deleteGuideAllocation);

module.exports = router;
