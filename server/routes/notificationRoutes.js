const express = require("express");
const router = express.Router();
const {
  fetchNotifications,
  createNotification,
  markAllAsRead,
  markAsRead,
  getUnreadNotificationCount,
  sendNotificationToStudents,
  sendNotificationToAllGuides,
} = require("../controllers/notificationController");
const {
  validateToken,
  checkRoleAccess,
} = require("../middleware/authMiddleware");

// Fetch notifications for the authenticated user
router.get(
  "/",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  fetchNotifications
);

// Create a notification (admin only)
router.post("/", validateToken, checkRoleAccess(["admin"]), createNotification);

// Mark all notifications as read for the authenticated user
router.put(
  "/mark-all-read",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  markAllAsRead
);

// Mark a single notification as read for the authenticated user
router.put(
  "/:notificationId/mark-read",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  markAsRead
);

router.get(
  "/unread-count",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  getUnreadNotificationCount
);

// Route for sending notifications to specific students
router.post(
  "/notify-students",
  validateToken,
  checkRoleAccess(["admin"]),
  sendNotificationToStudents
);

// Route for sending notifications to all guides
router.post(
  "/notify-guides",
  validateToken,
  checkRoleAccess(["admin"]),
  sendNotificationToAllGuides
);

module.exports = router;
