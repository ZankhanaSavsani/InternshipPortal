const Notification = require("../models/NotificationModel");
const Student = require("../models/StudentModel");
const Guide = require("../models/GuideModel");

// Helper function to get user model name
const getUserModelName = (user) => {
  if (user.constructor.modelName) {
    return user.constructor.modelName.toLowerCase();
  }
  return user.role.toLowerCase(); // Fallback to role field if modelName not available
};

// Fetch all notifications for a user
exports.fetchNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = getUserModelName(req.user);

    const notifications = await Notification.find({
      "recipients.id": userId,
      "recipients.model": userModel,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate('sender.id', 'name email')
      .exec();

    res.status(200).json({ 
      success: true, 
      notifications: notifications.map(notif => ({
        ...notif.toObject(),
        isUnread: notif.recipients.find(r => 
          r.id.equals(userId) && r.model === userModel && !r.isRead
        )
      }))
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get recent notifications (last 5)
exports.getRecentNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = getUserModelName(req.user);

    const query = {
      "recipients.id": userId,
      "recipients.model": userModel,
      isDeleted: false
    };

    // Add type filter for guides
    if (userModel === 'guide') {
      query.type = { 
        $in: [
          'WEEKLY_REPORT_SUBMISSION',
          'STUDENT_ASSIGNMENT',
          'GUIDE_SPECIFIC_ANNOUNCEMENT'
        ]
      };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender.id', 'name email')
      .exec();

    res.status(200).json({ 
      success: true, 
      notifications: notifications.map(notif => ({
        ...notif.toObject(),
        isUnread: notif.recipients.find(r => 
          r.id.equals(userId) && r.model === userModel && !r.isRead
        )
      }))
    });
  } catch (error) {
    console.error("Error fetching recent notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create a notification (admin only)
exports.createNotification = async (req, res) => {
  try {
    const {
      recipients,
      title,
      message,
      type,
      targetFilters,
      link,
      priority = 'medium',
      expiresAt,
    } = req.body;

    const sender = {
      id: req.user._id,
      model: getUserModelName(req.user),
      name: req.user.name || req.user.username,
    };

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

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = getUserModelName(req.user);

    await Notification.updateMany(
      { 
        "recipients.id": userId,
        "recipients.model": userModel,
        "recipients.isRead": false 
      },
      {
        $set: {
          "recipients.$[elem].isRead": true,
          "recipients.$[elem].readAt": new Date()
        }
      },
      { arrayFilters: [{ "elem.id": userId, "elem.model": userModel }] }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const userId = req.user._id;
    const userModel = getUserModelName(req.user);

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        "recipients.id": userId,
        "recipients.model": userModel
      },
      {
        $set: {
          "recipients.$.isRead": true,
          "recipients.$.readAt": new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get unread notification count
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = getUserModelName(req.user);

    const unreadCount = await Notification.countDocuments({
      "recipients.id": userId,
      "recipients.model": userModel,
      "recipients.isRead": false,
      isDeleted: false
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get unread count",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Send notification to students by year/semester
exports.sendNotificationToStudents = async (req, res) => {
  try {
    const { title, message, year, semester, priority = 'medium', link } = req.body;
    const sender = {
      id: req.user._id,
      model: getUserModelName(req.user),
      name: req.user.name || req.user.username,
    };

    const students = await Student.find({ year, semester }).select("_id");
    if (!students.length) {
      return res.status(400).json({
        success: false,
        message: "No students found for the specified year and semester",
      });
    }

    const recipients = students.map(student => ({
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

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error("Error sending notification to students:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send notification to all guides
exports.sendNotificationToAllGuides = async (req, res) => {
  try {
    const { title, message, priority = 'medium', link } = req.body;
    const sender = {
      id: req.user._id,
      model: getUserModelName(req.user),
      name: req.user.name || req.user.username,
    };

    const guides = await Guide.find().select("_id");
    if (!guides.length) {
      return res.status(400).json({
        success: false,
        message: "No guides found",
      });
    }

    const recipients = guides.map(guide => ({
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

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error("Error sending notification to guides:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};