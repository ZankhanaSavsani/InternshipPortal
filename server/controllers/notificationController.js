const Notification = require("../models/NotificationModel");
const Student = require("../models/StudentModel");
const Guide = require("../models/GuideModel");

// Fetch notifications for a user (admin, guide, or student)
exports.fetchNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is available in the request (from authentication middleware)
    const userModel = req.user.constructor.modelName.toLowerCase(); // Get the user's model name (admin, guide, or student)

    // Fetch notifications where the user is a recipient
    const notifications = await Notification.find({
      "recipients.id": userId,
      "recipients.model": userModel,
      isDeleted: false, // Exclude soft-deleted notifications
    })
      .sort({ createdAt: -1 }) // Sort by latest first
      .exec();

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create a notification (admin can send messages to students and guides)
exports.createNotification = async (req, res) => {
  try {
    const {
      recipients,
      title,
      message,
      type,
      targetFilters,
      link,
      priority,
      expiresAt,
    } = req.body;
    const sender = {
      id: req.user._id, // Assuming the sender is the authenticated admin
      model: req.user.constructor.modelName.toLowerCase(), // Get the sender's model name
      name: req.user.name, // Assuming the sender has a name field
    };

    // Create the notification
    const notification = await Notification.createNotification({
      sender,
      recipients,
      title,
      message,
      type,
      targetFilters,
      link,
      priority,
      expiresAt,
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is available in the request

    // Mark all notifications as read for the user
    await Notification.markAllAsReadForUser(userId);

    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Mark a single notification as read for a user
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const userId = req.user._id; // Assuming user ID is available in the request

    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    // Mark the notification as read for the user
    await notification.markAsRead(userId);

    res
      .status(200)
      .json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getUnreadNotificationCount = async (req, res) => {
  try {
    // 1. Validate request and user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user._id;
    const userRole = req.user.role.toLowerCase(); // Assuming user has a 'role' field

    // 2. Validate user role matches expected types
    const validRoles = ["admin", "guide", "student"];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // 3. Count unread notifications using proper field names
    const unreadCount = await Notification.countDocuments({
      recipients: {
        $elemMatch: {
          id: userId,
          model: userRole,
          isRead: false, // Changed from 'read' to 'isRead' to match schema
        },
      },
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", {
      error: error.message,
      userId: req.user?._id,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.sendNotificationToStudents = async (req, res) => {
  try {
    const { title, message, year, semester, priority, link } = req.body;
    const sender = {
      id: req.user._id,
      model: req.user.role.toLowerCase(),
      name: req.user.name || req.user.username,
    };

    // Get students based on year/semester
    const students = await Student.find({
      year: year,
      semester: semester,
    }).select("_id");

    if (!students.length) {
      return res.status(400).json({
        success: false,
        message: "No students found for the specified year and semester",
      });
    }

    // Prepare recipients
    const recipients = students.map((student) => ({
      id: student._id,
      model: "student",
    }));

    const notification = await Notification.createNotification({
      sender,
      recipients,
      title,
      message,
      type: "BROADCAST_MESSAGE",
      targetFilters: { year, semester },
      link,
      priority,
    });

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error sending notification to students:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.sendNotificationToAllGuides = async (req, res) => {
  try {
    const { title, message, priority, link } = req.body;
    const sender = {
      id: req.user._id,
      model: req.user.role.toLowerCase(),
      name: req.user.name || req.user.username,
    };

    // Get all guides
    const guides = await Guide.find().select("_id");

    if (!guides.length) {
      return res.status(400).json({
        success: false,
        message: "No guides found",
      });
    }

    // Prepare recipients
    const recipients = guides.map((guide) => ({
      id: guide._id,
      model: "guide",
    }));

    const notification = await Notification.createNotification({
      sender,
      recipients,
      title,
      message,
      type: "BROADCAST_MESSAGE",
      link,
      priority,
    });

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error sending notification to guides:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
