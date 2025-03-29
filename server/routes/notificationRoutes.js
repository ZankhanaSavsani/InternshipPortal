const express = require("express");
const router = express.Router();
const {
  fetchNotifications,
  getRecentNotifications,
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

// Fetch all notifications for the authenticated user
router.get(
  "/",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  fetchNotifications
);

// Get recent notifications (last 5)
router.get(
  "/recent",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  getRecentNotifications
);

// Create a notification (admin only)
router.post(
  "/",
  validateToken,
  checkRoleAccess(["admin"]),
  createNotification
);

// Mark all notifications as read for the authenticated user
router.put(
  "/mark-all-read",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  markAllAsRead
);

// Mark all notifications as read for a guide
router.put(
  "/mark-all-read/guide",
  validateToken,
  checkRoleAccess(["guide"]),
  markAllAsRead
);

// Mark a single notification as read for the authenticated user
router.put(
  "/:notificationId/mark-read",
  validateToken,
  checkRoleAccess(["admin", "guide", "student"]),
  markAsRead
);

// Mark a specific notification as read for a guide
router.put(
  "/:notificationId/mark-read/guide",
  validateToken,
  checkRoleAccess(["guide"]),
  markAsRead
);

// Get unread notification count
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