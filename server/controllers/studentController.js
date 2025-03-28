// controllers/studentController.js
const Student = require("../models/StudentModel");
const logger = require("../utils/logger");
const { sendEmail } = require("../utils/mailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const StudentInternship = require("../models/StudentInternshipModel");

// @desc   Create a new student record
// @route  POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    const { studentId, semester } = req.body;

    // Generate random password before creating student
    const plainPassword = crypto.randomBytes(8).toString("hex");

    // Create the student with the plain password
    const student = new Student({
      studentId,
      semester,
      password: plainPassword, // This will be hashed in the pre-save hook
    });

    // Save the student to the database
    await student.save();
    logger.info(`[POST /api/students] Created student ID: ${student._id}`);

    // Prepare email content with HTML formatting
    const emailSubject =
      "🎓 Welcome to Student Portal - Your Login Credentials";
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Student Portal</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
          }
          .email-container {
            border: 1px solid #e0e0e0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            background-color: #ffffff;
          }
          .email-header {
            background-color: #3b82f6;
            color: white;
            padding: 20px 10px;
            text-align: center;
          }
          .logo {
            margin-bottom: 15px;
          }
          .email-body {
            padding: 30px;
            background-color: #ffffff;
            text-align: center;
          }
          .welcome-emoji {
            font-size: 40px;
            margin-bottom: 15px;
          }
          .credentials-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
          }
          .credential-item {
            margin-bottom: 15px;
          }
          .credential-label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
          }
          .credential-value {
            font-family: monospace;
            background-color: #f3f4f6;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            letter-spacing: 0.5px;
          }
          .important-note {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 25px 0;
            text-align: left;
            border-radius: 8px;
          }
          .email-footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 0.9em;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            color: #f7f7f7;
            background: rgb(247, 247, 247);
            border: 2px solid black;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            margin-top: 20px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            transition: all 0.2s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
          }
          .support-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 0.9em;
            color: #6b7280;
          }
          .emoji {
            font-size: 20px;
            vertical-align: middle;
            margin-right: 5px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Welcome to Student Portal</h1>
          </div>
          <div class="email-body">
            <div class="welcome-emoji">
              🎓✨
            </div>
            <h2>Hi Student!</h2>
            <p>A new account for <strong>${studentId}</strong> has been created for you. Login to your account with the credentials listed below.</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <span class="credential-label"><span class="emoji">👤</span> Username:</span>
                <span class="credential-value">${studentId}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label"><span class="emoji">🔑</span> Password:</span>
                <span class="credential-value">${plainPassword}</span>
              </div>
            </div>
            
            <div class="important-note">
              <span class="emoji">⚠️</span> <strong>Important:</strong> Please change your password after logging in for the first time for security purposes.
            </div>
            
            <a href="http://localhost:3000/login" class="button">Login to Your Account</a>
            
            <div class="support-section">
              <h3><span class="emoji">📞</span> Need Help?</h3>
              <p>Text or Call: Brinda Patel : 74052 81125 | Email: brindapatel.cse@charusat.ac.in</p>
              <p>Abhishek Patel : 90990 56918 | Email: abhishekpatel.cse@charusat.ac.in</p>
            </div>
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()}	Charotar University of Science & Technology (CHARUSAT). All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send HTML email with credentials
    await sendEmail(student.email, emailSubject, emailContent, true);

    // Respond to the client
    res.status(201).json({
      success: true,
      data: {
        id: student._id,
        studentId: student.studentId,
        email: student.email,
      },
    });
  } catch (error) {
    logger.error(`[POST /api/students] Error: ${error.message}`);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A student with the same ID, semester, and year already exists.",
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the student.",
    });
  }
};

// @desc   Get all students
// @route  GET /api/students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find({ isDeleted: false });
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    logger.error(`[GET /api/students] Error: ${error.message}`);
    next(error);
  }
};

// @desc   Get student by ID
// @route  GET /api/students/:id
exports.getStudentById = async (req, res, next) => {
  try {
    // Validate the ID parameter
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid student ID" });
    }

    // Find the student by ID and ensure they are not deleted
    const student = await Student.findOne({
      _id: req.user._id,
      isDeleted: false,
    }).select("-password");

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    logger.error(`[GET /api/students/${req.user._id}] Error: ${error.message}`);
    next(error);
  }
};

// @desc   Update a student record
// @route  PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id; // Get the student's _id from the URL params
    const updateData = req.body; // Get the update data from the request body

    // Validate updateData (optional, but recommended)
    if (!updateData || Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No data provided to update" });
    }

    // Check if the password is being updated
    if (updateData.password) {
      // Hash the new password
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Find and update the student
    const updatedStudent = await Student.findOneAndUpdate(
      { _id: studentId, isDeleted: false }, // Query
      updateData, // Update data
      { new: true, runValidators: true } // Options
    );

    // If no student is found, return a 404 error
    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found or has been deleted",
      });
    }

    // Return the updated student data
    res.status(200).json({ success: true, data: updatedStudent });
  } catch (error) {
    // Log the error and pass it to the error handler
    console.error(
      `[PUT /api/students/${req.params.id}] Error: ${error.message}`,
      {
        error,
      }
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};

// @desc   Update student name, onboarding status, and optionally password
// @route  PATCH /api/students/:id
exports.updateStudentName = async (req, res) => {
  try {
    const id = req.user._id;
    const { studentName, isOnboarded, password } = req.body;

    // Prepare update object
    const updateData = {
      studentName,
      isOnboarded,
    };

    // If password is provided, hash it before updating
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.status(200).json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// @desc   Change student password
// @route  PATCH /api/students/change-password/:id
// @access Private (only the student can change their own password)
exports.changePassword = async (req, res) => {
  try {
    const id = req.user._id; // Ensure this is set correctly
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Current password and new password are required",
        });
    }

    // Find the student by ID
    const student = await Student.findById(id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Verify the current password
    const isMatch = await student.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }
    console.log("Password comparison result:", isMatch);

    // Update the password
    student.password = newPassword;
    await student.save();
    console.log("Updated student:", student);

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// @desc   Soft delete a student record
// @route  DELETE /api/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    // Use the ID from the URL parameter instead of the logged-in user's ID
    const studentId = req.params.id;
    
    const student = await Student.findById(studentId);
    
    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Student not found or already deleted",
      });
    }
    
    student.isDeleted = true;
    student.deletedAt = new Date();
    await student.save();
    
    res
      .status(200)
      .json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    logger.error(
      `[DELETE /api/students/${req.params.id}] Error: ${error.message}`
    );
    next(error);
  }
};

// Fetch student by studentId and semester
exports.fetchStudent = async (req, res) => {
  try {
    const { studentId, semester } = req.query;

    if (!studentId || !semester) {
      return res
        .status(400)
        .json({
          success: false,
          message: "studentId and semester are required",
        });
    }

    // Validate semester
    if (isNaN(semester)) {
      return res
        .status(400)
        .json({ success: false, message: "Semester must be a number" });
    }

    // Convert studentId to lowercase to match the schema
    const lowercaseStudentId = studentId.toLowerCase();

    // Find the student by studentId and semester
    const student = await Student.findOne({
      studentId: lowercaseStudentId,
      semester: parseInt(semester),
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Return the student's data in a consistent structure
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error("Error fetching student data:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};

// @desc    Restore a soft-deleted student
// @route   PATCH /api/students/restore/:id
// @access  Private (Admin only)
exports.restoreStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Find and update the student
    const restoredStudent = await Student.findOneAndUpdate(
      { _id: studentId, isDeleted: true }, // Query: Only restore if the student is soft-deleted
      { isDeleted: false, deletedAt: null }, // Update data
      { new: true, runValidators: true } // Options
    );

    // If no student is found, return a 404 error
    if (!restoredStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found or already active",
      });
    }

    // Return the restored student data
    res.status(200).json({ success: true, data: restoredStudent });
  } catch (error) {
    console.error(`[PATCH /api/students/restore/${req.params.id}] Error: ${error.message}`, {
      error,
    });
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
