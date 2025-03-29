const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Sender details
    sender: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "sender.model", // Reference to Admin, Guide, or Student model
      },
      model: {
        type: String,
        required: true,
        enum: ["Admin", "Guide", "Student"],
      },
      name: String,
    },

    // Recipients of the notification
    recipients: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "recipients.model", // Reference to Admin, Guide, or Student model
        },
        model: {
          type: String,
          required: true,
          enum: ["Admin", "Guide", "Student"],
        },
        isRead: {
          type: Boolean,
          default: false, // Track whether the recipient has read the notification
        },
        readAt: {
          type: Date,
          default: null, // Store the timestamp when the notification was read
        },
      },
    ],

    // Notification content
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // Type of notification
    type: {
      type: String,
      required: true,
      enum: [
        "COMPANY_APPROVAL_STATUS_CHANGE",
        "WEEKLY_REPORT_STATUS_CHANGE",
        "BROADCAST_MESSAGE",
        "MARKS_CHANGE",
        "COMPANY_APPROVAL_SUBMISSION",
        "COMPANY_APPROVAL_STATUS_CHANGE",
        "WEEKLY_REPORT_SUBMISSION",
        "WEEKLY_REPORT_STATUS_CHANGE",
        "INTERNSHIP_COMPLETION_SUBMISSION",
        "INTERNSHIP_STATUS_SUBMISSION",
        "BROADCAST_MESSAGE",
        "WEEKLY_REPORT_SUBMISSION_GUIDE",
      ],
    },

    // Additional data specific to marks change
    marksData: {
      subject: String,
      oldMarks: Number,
      newMarks: Number,
      remarks: String
    },

    // Filters for targeted notifications (used for broadcasting messages to specific year/semester students)
    targetFilters: {
      year: String, // Target year
      semester: Number, // Target semester
    },

    // Priority of the notification
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // to share relevant link
    link: {
      type: String,
      default: null, // Can store a URL or document link
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(v);
        },
        message: "Invalid URL format",
      },
    },

    // Soft deletion fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    // Expiry date for the notification
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Indexes for better query performance
notificationSchema.index({ "sender.id": 1, createdAt: -1 }); // Index for retrieving sender-based notifications
notificationSchema.index({
  "recipients.id": 1,
  "recipients.isRead": 1,
  createdAt: -1,
}); // Index for fetching unread notifications efficiently
notificationSchema.index({ type: 1, createdAt: -1 }); // Index for filtering notifications by type
notificationSchema.index({
  "targetFilters.year": 1,
  "targetFilters.semester": 1,
}); // Index for filtering broadcast messages
notificationSchema.index({ isDeleted: 1 }); // Index for soft deletion

// Static method to create a new notification
notificationSchema.statics.createNotification = async function ({
  sender,
  recipients,
  title,
  message,
  type,
  targetFilters = null,
  link = null,
  priority = "medium",
  expiresAt = null,
}) {
  // Validate recipients exists and is an array
  if (!recipients || !Array.isArray(recipients)) {
    throw new Error("Recipients must be an array");
  }

  // Ensure each recipient has required fields
  const validatedRecipients = recipients.map((recipient) => {
    if (!recipient.id || !recipient.model) {
      throw new Error("Each recipient must have an id and model");
    }
    return {
      id: recipient.id,
      model: recipient.model.toLowerCase(),
      isRead: false,
      readAt: null,
    };
  });

  const notification = new this({
    sender,
    recipients: validatedRecipients,
    title,
    message,
    type,
    targetFilters,
    link,
    priority,
    expiresAt,
  });
  return await notification.save();
};

// Optimized method to mark notifications as read for a user
notificationSchema.statics.markAllAsReadForUser = async function (userId) {
  return await this.updateMany(
    { "recipients.id": userId }, // Find notifications where the user is a recipient
    {
      $set: {
        "recipients.$[elem].isRead": true, // Update all matching recipients
        "recipients.$[elem].readAt": new Date(),
      },
    },
    {
      arrayFilters: [{ "elem.id": userId }], // Filter to update all matching recipients
    }
  );
};

// Method to mark a single notification as read for a recipient
notificationSchema.methods.markAsRead = async function (recipientId) {
  const recipient = this.recipients.find((r) => r.id.equals(recipientId));
  if (recipient && !recipient.isRead) {
    recipient.isRead = true;
    recipient.readAt = new Date(); // Store the timestamp when marked as read
    await this.save();
  }
};

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
