const StudentInternship = require("../models/StudentInternshipModel");
const Student = require("../models/StudentModel");
const Guide = require("../models/GuideModel");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// @desc    Add a weekly report to a student internship record
// @route   POST /api/student-internships/:id/weekly-reports
exports.addWeeklyReport = async (req, res, next) => {
  try {
    const { id } = req.params; // StudentInternship ID
    const { weeklyReportId } = req.body; // WeeklyReport ID

    if (!mongoose.Types.ObjectId.isValid(weeklyReportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid weekly report ID format",
      });
    }

    const weeklyReportExists = await WeeklyReport.findById(weeklyReportId);
    if (!weeklyReportExists) {
      return res.status(404).json({
        success: false,
        message: "Weekly report not found.",
      });
    }

    // Update the StudentInternship document
    const updatedStudentInternship = await StudentInternship.findByIdAndUpdate(
      id,
      { $addToSet: { weeklyReports: weeklyReportId } },
      { new: true }
    );

    if (!updatedStudentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedStudentInternship,
    });
  } catch (error) {
    logger.error(
      `[POST /api/student-internships/${req.params.id}/weekly-reports] Error: ${error.message}`
    );
    next(new Error(`Failed to add weekly report: ${error.message}`));
  }
};

// @desc    Add company approval details to a student internship record
// @route   POST /api/student-internships/:id/company-approvals
exports.addCompanyApprovalDetails = async (req, res, next) => {
  try {
    const { id } = req.params; // StudentInternship ID
    const { companyApprovalId } = req.body; // CompanyApprovalDetails ID

    if (!mongoose.Types.ObjectId.isValid(companyApprovalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company Approval ID format",
      });
    }

    const companyApprovalExists = await CompanyApprovalDetails.findById(
      companyApprovalId
    );
    if (!companyApprovalExists) {
      return res.status(404).json({
        success: false,
        message: "Company approval details not found.",
      });
    }

    // Update the StudentInternship document
    const updatedStudentInternship = await StudentInternship.findByIdAndUpdate(
      id,
      { $addToSet: { companyApprovalDetails: companyApprovalId } },
      { new: true }
    );

    if (!updatedStudentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedStudentInternship,
    });
  } catch (error) {
    logger.error(
      `[POST /api/student-internships/${req.params.id}/company-approvals] Error: ${error.message}`
    );
    next(new Error(`Failed to add company approval details: ${error.message}`));
  }
};

// @desc    Add summer internship status to a student internship record
// @route   POST /api/student-internships/:id/summer-internship-status
exports.addSummerInternshipStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // StudentInternship ID
    const { summerInternshipStatusId } = req.body; // SummerInternshipStatus ID

    if (!mongoose.Types.ObjectId.isValid(summerInternshipStatusId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Summer Internship Status ID format",
      });
    }

    const summerInternshipStatusExists = await SummerInternshipStatus.findById(
      summerInternshipStatusId
    );
    if (!summerInternshipStatusExists) {
      return res.status(404).json({
        success: false,
        message: "Summer internship status not found.",
      });
    }

    // Update the StudentInternship document
    const updatedStudentInternship = await StudentInternship.findByIdAndUpdate(
      id,
      { $addToSet: { summerInternshipStatus: summerInternshipStatusId } },
      { new: true }
    );

    if (!updatedStudentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedStudentInternship,
    });
  } catch (error) {
    logger.error(
      `[POST /api/student-internships/${req.params.id}/summer-internship-status] Error: ${error.message}`
    );
    next(new Error(`Failed to add summer internship status: ${error.message}`));
  }
};

// @desc    Add summer internship completion status to a student internship record
// @route   POST /api/student-internships/:id/summer-internship-completion-status
exports.addSummerInternshipCompletionStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // StudentInternship ID
    const { summerInternshipCompletionStatusId } = req.body; // SummerInternshipCompletionStatus ID

    if (!mongoose.Types.ObjectId.isValid(summerInternshipCompletionStatusId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Summer Internship Completion StatusID format",
      });
    }

    const summerInternshipCompletionStatusExists =
      await SummerInternshipCompletionStatus.findById(
        summerInternshipCompletionStatusId
      );
    if (!summerInternshipCompletionStatusExists) {
      return res.status(404).json({
        success: false,
        message: "Summer internship completion status not found.",
      });
    }

    // Update the StudentInternship document
    const updatedStudentInternship = await StudentInternship.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          summerInternshipCompletionStatus: summerInternshipCompletionStatusId,
        },
      },
      { new: true }
    );

    if (!updatedStudentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedStudentInternship,
    });
  } catch (error) {
    logger.error(
      `[POST /api/student-internships/${req.params.id}/summer-internship-completion-status] Error: ${error.message}`
    );
    next(new Error(`Failed to add summer internship completion status: ${error.message}`));
  }
};

// @desc    Update the guide for a student internship record (manually assigned by admin)
// @route   PUT /api/student-internships/:id/update-guide
exports.updateGuide = async (req, res, next) => {
  try {
    const { id } = req.params; // StudentInternship ID
    const { guideId } = req.body; // New guide ID

    if (!mongoose.Types.ObjectId.isValid(guideId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid guide ID format",
      });
    }

    // Check if the guide exists
    const guideExists = await Guide.findById(guideId);
    if (!guideExists) {
      return res.status(404).json({
        success: false,
        message: "Guide not found.",
      });
    }

    // Update the StudentInternship document
    const updatedStudentInternship = await StudentInternship.findByIdAndUpdate(
      id,
      { guide: guideId, isGuideManuallyAssigned: true }, // Mark as manually assigned
      { new: true }
    );

    if (!updatedStudentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedStudentInternship,
    });
  } catch (error) {
    logger.error(
      `[PUT /api/student-internships/${req.params.id}/update-guide] Error: ${error.message}`
    );
    next(new Error(`Failed to update guide: ${error.message}`));
  }
};

// @desc    Fetch Student Internship Data by Student ID and Semester
// @route   GET /api/studentInternship/student/:studentId
// @access  Private
exports.getStudentInternshipByStudentIdAndSemester = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;

    // Validate input
    if (!studentId || !semester) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Semester are required.",
      });
    }

    // Find the student by studentId and semester
    const student = await Student.findOne({ studentId, semester: parseInt(semester) });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found for the given semester.",
      });
    }

    // Find the StudentInternship record for the student and semester
    const studentInternship = await StudentInternship.findOne({
      student: student._id,
      semester: parseInt(semester),
    })
      .populate("guide", "name email") // Populate guide details
      .populate("weeklyReports") // Populate weekly reports
      .populate("companyApprovalDetails") // Populate company approval details
      .populate("summerInternshipStatus") // Populate summer internship status
      .populate("summerInternshipCompletionStatus"); // Populate summer internship completion status

    if (!studentInternship) {
      return res.status(404).json({
        success: false,
        message: "No internship record found for this student and semester.",
      });
    }

    res.status(200).json({
      success: true,
      data: studentInternship,
    });
  } catch (error) {
    logger.error(
      `[GET /api/studentInternship/student/${req.params.studentId}] Error: ${error.message}`
    );
    next(new Error(`Failed to fetch student internship data: ${error.message}`));
  }
};