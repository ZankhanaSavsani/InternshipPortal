const mongoose = require("mongoose");

const companyApprovalDetailsSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
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
    numberOfEmployees: {
      type: Number,
      min: 1,
      default: 1, // Adding default value for optional field
    },
    branches: [
      {
        location: { type: String, required: true },
      },
    ],
    headOfficeAddress: {
      type: String,
      required: true,
    },
    stipendAmount: {
      type: Number,
      required: true,
      min: 0,
    },
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
    currentProject: {
      type: String,
      required: true,
    },
    clients: {
      type: [String],
      required: true, // Changed to required for clarity
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one client is required",
      },
    },
    sourceOfCompany: {
      type: String,
      required: true,
    },
    reasonToChoose: {
      type: String,
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const CompanyApprovalDetails = mongoose.model(
  "CompanyApprovalDetails",
  companyApprovalDetailsSchema
);

module.exports = CompanyApprovalDetails;
