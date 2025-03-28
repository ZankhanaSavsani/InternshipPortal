const logger = require("../utils/logger");
const {
  generateCustomFilename,
  uploadFileToDrive,
  deleteLocalFile,
} = require("../utils/googleDriveUtils");
const SummerInternshipCompletionStatus = require("../models/SummerInternshipCompletionFormModel");
const mongoose = require("mongoose");
const StudentInternship = require("../models/StudentInternshipModel");

// @desc   Get all internship completion statuses (including soft-deleted ones if requested)
// @route  GET /api/summer-internships-completion
exports.getAllInternshipCompletionStatuses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Dynamic sorting
    const validSortFields = ["createdAt", "companyName", "typeOfInternship"];
    const sortField = validSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const sortOptions = { [sortField]: sortOrder };

    // Dynamic filtering
    const filterOptions = {};

    // Include soft-deleted records if requested
    if (req.query.includeDeleted !== "true") {
      filterOptions.isDeleted = false; // Exclude soft-deleted records by default
    }

    if (req.query.companyName) {
      filterOptions.companyName = {
        $regex: req.query.companyName,
        $options: "i",
      };
    }
    if (req.query.studentName) {
      filterOptions.studentName = {
        $regex: req.query.studentName,
        $options: "i",
      };
    }
    if (req.query.typeOfInternship) {
      filterOptions.typeOfInternship = req.query.typeOfInternship;
    }

    // Fetch internship completion statuses
    const statuses = await SummerInternshipCompletionStatus.find(filterOptions)
      .populate("student", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get the total number of matching records
    const total = await SummerInternshipCompletionStatus.countDocuments(
      filterOptions
    );

    res.status(200).json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data: statuses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get a specific internship completion status by ID (excluding soft-deleted records unless explicitly requested)
// @route  GET /api/summer-internships-completion/:id
exports.getInternshipCompletionStatusById = async (req, res, next) => {
  try {
    const status = await SummerInternshipCompletionStatus.findById(
      req.params.id
    ).populate("student", "name email");

    if (!status || (status.isDeleted && req.query.includeDeleted !== "true")) {
      return res.status(404).json({ message: "Internship status not found" });
    }

    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

// @desc   Create a new internship completion status
// @route  POST /api/summer-internships-completion
exports.createInternshipCompletionStatus = async (req, res, next) => {
  try {
    console.log("Request User:", req.user);

    // Check if mongoose is properly imported
    if (!mongoose) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: mongoose not available",
      });
    }

    // Make sure req.user exists
    if (!req.user) {
      logger.error("[POST /api/summer-internship-completion] User not authenticated");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Convert _id to proper ObjectId if it's an array
    const student = Array.isArray(req.user._id)
      ? mongoose.Types.ObjectId(req.user._id[0])
      : req.user._id;

    const studentName = req.user.studentName;

    if (!student || !studentName) {
      logger.error("[POST /api/summer-internship-completion] Invalid user!!");
      return res.status(400).json({
        success: false,
        message: "Invalid user!!",
      });
    }

    const { files } = req;
    let internshipData = {
      ...req.body,
      student: student, // Use _id as the student reference
      studentName: studentName, // Use the student's name from the user data
    };

    // Check if completion certificate is provided (required)
    if (!files?.completionCertificate?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Completion certificate is required",
      });
    }

    // Generate custom filename for completion certificate
    const completionCertificateFilename = generateCustomFilename(
      req.user.studentId, // Assuming studentId is available in req.user
      req.user.studentName,
      "completionCertificate",
      files.completionCertificate[0].originalname
    );

    // Upload completion certificate to Google Drive
    try {
      const completionCertificateUrl = await uploadFileToDrive(
        files.completionCertificate[0],
        process.env.GOOGLE_DRIVE_FOLDER_ID,
        completionCertificateFilename
      );
      internshipData.completionCertificate = completionCertificateUrl;

      // Delete local file after upload
      await deleteLocalFile(files.completionCertificate[0].path);
    } catch (error) {
      logger.error("Error uploading completion certificate:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading completion certificate",
      });
    }

    // Upload stipend proof if provided (optional)
    if (files?.stipendProof?.[0]) {
      // Generate custom filename for stipend proof
      const stipendProofFilename = generateCustomFilename(
        req.user.studentId,
        req.user.studentName,
        "stipendProof",
        files.stipendProof[0].originalname
      );

      try {
        const stipendProofUrl = await uploadFileToDrive(
          files.stipendProof[0],
          process.env.GOOGLE_DRIVE_FOLDER_ID,
          stipendProofFilename
        );
        internshipData.stipendProof = stipendProofUrl;

        // Delete local file after upload
        await deleteLocalFile(files.stipendProof[0].path);
      } catch (error) {
        logger.error("Error uploading stipend proof:", error);
        return res.status(500).json({
          success: false,
          message: "Error uploading stipend proof",
        });
      }
    }

    // Create the internship completion status in the database
    const newStatus = await SummerInternshipCompletionStatus.create(
      internshipData
    );

    // Find the corresponding StudentInternship document
    const studentInternship = await StudentInternship.findOne({ student });

    if (!studentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }

    // Push the new internship completion status ObjectId into the summerInternshipCompletionStatus array
    studentInternship.summerInternshipCompletionStatus.push(newStatus._id);

    // Save the updated StudentInternship document
    await studentInternship.save();

    // Log success
    logger.info(
      `[POST /api/summer-internships-completion] Created ID: ${newStatus._id}`
    );

    // Send response
    res.status(201).json({
      success: true,
      data: newStatus,
    });
  } catch (error) {
    // If any error occurs, make sure to clean up any uploaded files
    if (req.files) {
      Object.values(req.files).forEach((fileArray) => {
        fileArray.forEach((file) => {
          if (file.path) {
            deleteLocalFile(file.path);
          }
        });
      });
    }
    next(error);
  }
};

// @desc   Update an internship completion status by ID
// @route  PUT /api/summer-internships-completion/:id
exports.updateInternshipCompletionStatus = async (req, res, next) => {
  try {
    const updatedStatus =
      await SummerInternshipCompletionStatus.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

    if (!updatedStatus || updatedStatus.isDeleted) {
      return res.status(404).json({ message: "Internship status not found" });
    }

    logger.info(`Internship completion status updated: ${updatedStatus._id}`);
    res.status(200).json(updatedStatus);
  } catch (error) {
    next(error);
  }
};

// @desc   Soft delete an internship completion status
// @route  DELETE /api/summer-internships-completion/:id
exports.deleteInternshipCompletionStatus = async (req, res, next) => {
  try {
    const status = await SummerInternshipCompletionStatus.findById(
      req.params.id
    );

    if (!status || status.isDeleted) {
      return res.status(404).json({
        message: "Internship status not found or already deleted",
      });
    }

    status.isDeleted = true;
    status.deletedAt = new Date();
    await status.save();

    logger.info(`Internship completion status soft deleted: ${status._id}`);
    res.status(200).json({
      message: "Internship status deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Restore a soft-deleted internship completion status
// @route  PATCH /api/summer-internships-completion/:id/restore
exports.restoreInternshipCompletionStatus = async (req, res, next) => {
  try {
    const status = await SummerInternshipCompletionStatus.findById(
      req.params.id
    );

    // Check if the record exists and is soft-deleted
    if (!status || !status.isDeleted) {
      return res.status(404).json({
        message: "Internship status not found or not deleted",
      });
    }

    // Restore the record
    status.isDeleted = false;
    status.deletedAt = null;
    await status.save();

    logger.info(`Internship completion status restored: ${status._id}`);
    res.status(200).json({
      success: true,
      message: `Internship status ${status._id} restored successfully`,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};