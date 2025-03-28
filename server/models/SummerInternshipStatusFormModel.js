const mongoose = require("mongoose");

const summerInternshipStatusSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student", // Reference to the Student model
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },

    // Company Details
    companyName: {
      type: String,
      required: true,
    },
    companyWebsite: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return /^(https?:\/\/)?([\da-z\.-]+)(\.[a-z\.]{2,6})?([\/\w \.-]*)*\/?$/.test(value);
        },
        message: "Invalid company website URL",
      },
    }, 
    companyAddress: {
      type: String,
      required: true,
    },
    companyCity: {
      type: String,
      required: true,
    },

    // Internship Details
    typeOfInternship: {
      type: String,
      enum: [
        "Development Project",
        "Inhouse/Research Project",
        "On Technology Training",
      ], // Allowed options
      required: true,
    },
    technologies: {
      type: [String],
      required: true, // Changed to required for clarity
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one technology is required",
      },
    },
    technologiesDetails: {
      type: String,
      required: true,
    },
    modeOfInternship: {
      type: String,
      enum: ["Offline", "Online", "Hybrid"], // Allowed options
      required: true,
    },

    // HR Contact Details
    hrDetails: {
      name: { type: String, required: true },
      phone: {
        type: String,
        required: true,
        validate: {
          validator: function (value) {
            return /^\+?[\d\s-]{10,}$/.test(value);
          },
          message: "Invalid phone number format",
        },
      },
      email: {
        type: String,
        required: true,
        validate: {
          validator: function (value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          },
          message: "Invalid email format",
        },
      },
    },

    // Financial & Document Details
    stipendAmount: {
      type: Number,
      required: true,
      min: 0, // Ensures non-negative value
    },
    offerLetter: {
      type: String, // File path or URL to the uploaded file
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const SummerInternshipStatus = mongoose.model(
  "SummerInternshipStatus",
  summerInternshipStatusSchema
);

module.exports = SummerInternshipStatus;
