const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const comparePassword = require("../utils/passwordUtils"); // Import the function
const GuideAllocation = require("../models/GuideAllocationModel"); // Import the GuideAllocation model
const StudentInternship = require("../models/StudentInternshipModel"); // Import the StudentInternship model

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    studentName: {
      type: String,
      default: "",
      trim: true,
    },
    isOnboarded: {
      type: Boolean,
      default: false, // Set to true after the student provides their name
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "student",
      enum: ["student"],
      required: true,
    },
    semester: {
      type: Number,
      enum: [5, 7],
      required: true,
    },
    year: {
      type: String, // Format: "2025-2026"
      required: false,
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

// Create a compound index for `studentId`, `semester`, and `year`
studentSchema.index({ studentId: 1, semester: 1, year: 1 }, { unique: true });

// Pre-save hook for hashing password, setting email, and assigning guide
studentSchema.pre("save", async function (next) {
  try {
    // Convert studentId to lowercase
    this.studentId = this.studentId.toLowerCase();

    // Automatically generate email from the studentId
    this.email = `${this.studentId}@charusat.edu.in`;

    // Hash the password before saving
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Auto-generate academic year
    const currentYear = new Date().getFullYear();
    this.year = `${currentYear}-${currentYear + 1}`;

    // Assign guide if the student falls within an allocated range
    const guideAllocations = await GuideAllocation.find({ semester: this.semester });

    for (const allocation of guideAllocations) {
      const { guide, range } = allocation;

      // Parse the range and generate student IDs
      const { year, dept, startDigits, endDigits } = parseStudentIdRange(range);
      const studentIds = generateStudentIds(year, dept, startDigits, endDigits);

      // Check if the student ID falls within the range
      if (studentIds.includes(this.studentId)) {
        // Check if the student already has a manually assigned guide
        const existingInternship = await StudentInternship.findOne({
          student: this._id,
          semester: this.semester,
        });

        // Only assign the guide if it's not manually assigned
        if (!existingInternship || !existingInternship.isGuideManuallyAssigned) {
          await StudentInternship.findOneAndUpdate(
            { student: this._id, semester: this.semester },
            { guide, semester: this.semester, isGuideManuallyAssigned: false }, // Mark as automatically assigned
            { upsert: true }
          );

          console.log(`Assigned guide ${guide} to student ${this.studentId} for semester ${this.semester}`);
        } else {
          console.log(`Guide for student ${this.studentId} is manually assigned and will not be overridden.`);
        }

        break; // Exit loop once the guide is assigned or skipped
      }
    }

    // Create a StudentInternship document if it doesn't exist
    const existingInternship = await StudentInternship.findOne({
      student: this._id,
      semester: this.semester,
    });

    if (!existingInternship) {
      const newInternship = new StudentInternship({
        student: this._id,
        semester: this.semester,
        guide: null, // Guide will be assigned later if applicable
        isGuideManuallyAssigned: false,
      });

      await newInternship.save();
      console.log(`Created StudentInternship for student ${this.studentId} for semester ${this.semester}`);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Helper function to parse student ID range
function parseStudentIdRange(range) {
  const [startId, endId] = range.split("-");

  if (!startId || !endId) {
    throw new Error("Invalid range format. Expected format: 22cs078-22cs082");
  }

  const startYear = startId.slice(0, 2);
  const startDept = startId.slice(2, 4);
  const startDigits = parseInt(startId.slice(4), 10);

  const endYear = endId.slice(0, 2);
  const endDept = endId.slice(2, 4);
  const endDigits = parseInt(endId.slice(4), 10);

  if (startYear !== endYear || startDept !== endDept) {
    throw new Error("Year and department must be the same in the range.");
  }

  if (startDigits > endDigits) {
    throw new Error("Start digits must be less than or equal to end digits.");
  }

  return { year: startYear, dept: startDept, startDigits, endDigits };
}

// Helper function to generate student IDs
function generateStudentIds(year, dept, startDigits, endDigits) {
  const studentIds = [];
  for (let i = startDigits; i <= endDigits; i++) {
    const digits = i.toString().padStart(3, "0"); // Ensure 3 digits (e.g., 078)
    studentIds.push(`${year}${dept}${digits}`);
  }
  return studentIds;
}

studentSchema.methods.comparePassword = comparePassword;

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;