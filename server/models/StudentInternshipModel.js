const mongoose = require("mongoose");

const studentInternshipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guide",
    },
    semester: {
      type: Number,
      enum: [5, 7],
      required: true,
    },
    isGuideManuallyAssigned: {
      type: Boolean,
      default: false, // Default to false (automatically assigned)
    },
    weeklyReports: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "WeeklyReport",
      default: [],
    },
    companyApprovalDetails: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "CompanyApprovalDetails",
      default: [],
    },
    summerInternshipStatus: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "SummerInternshipStatus",
      default: [],
    },
    summerInternshipCompletionStatus: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "SummerInternshipCompletionStatus",
      default: [],
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
  {
    timestamps: true,
  }
);

// Indexes
studentInternshipSchema.index({ student: 1, semester: 1 }, { unique: true }); // Make it truly unique
studentInternshipSchema.index({ guide: 1 });

// Soft delete pre-hook
studentInternshipSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

const StudentInternship = mongoose.model(
  "StudentInternship",
  studentInternshipSchema
);

module.exports = StudentInternship;
