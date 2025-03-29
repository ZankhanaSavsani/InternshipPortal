const SummerInternshipStatus = require("../models/SummerInternshipStatusFormModel");
const logger = require("../utils/logger");
const {
  generateCustomFilename,
  uploadFileToDrive,
  deleteLocalFile,
} = require("../utils/googleDriveUtils");
const mongoose = require("mongoose");
const objectId = new mongoose.Types.ObjectId(); 
const StudentInternship = require("../models/StudentInternshipModel");
const Admins = require("../models/AdminModel");
const Notification = require("../models/NotificationModel");

// @desc   Get all internship statuses (including soft-deleted ones if requested)
// @route  GET /api/summer-internships
exports.getAllInternshipStatuses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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
    if (req.query.typeOfInternship) {
      filterOptions.typeOfInternship = req.query.typeOfInternship;
    }

    // Fetch internship statuses
    const statuses = await SummerInternshipStatus.find(filterOptions)
      .populate("student", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await SummerInternshipStatus.countDocuments(filterOptions);

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

// @desc   Get internship status by ID
// @route  GET /api/summer-internships/:id
exports.getInternshipStatusById = async (req, res, next) => {
  try {
    const status = await SummerInternshipStatus.findById(req.params.id);
    if (!status || status.isDeleted) {
      logger.error(`Internship status ID ${req.params.id} not found or deleted`);
      return res.status(404).json({ message: "Internship status not found" });
    }
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

// @desc   Create a new internship status
// @route  POST /api/summer-internships
exports.createInternshipStatus = async (req, res, next) => {
  try {
    const { file } = req; // Use req.file for single file uploads

    console.log("Request User:", req.user);

    // Check if mongoose is properly imported
    if (!mongoose) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: mongoose not available",
      });
    }

    // Make sure req.user exists
    if (!req.user || !req.user.studentId || !req.user.studentName) {
      logger.error("[POST /api/summer-internship-status] Invalid user data");
      return res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }

    // Convert _id to proper ObjectId
    // Convert _id to proper ObjectId if it's an array
        const student = Array.isArray(req.user._id)
          ? mongoose.Types.ObjectId(req.user._id[0])
          : req.user._id;
    const studentName = req.user.studentName;

    // Check if offerLetter file is uploaded
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Offer letter file is required",
      });
    }

    // Generate custom filename for offer letter
    const offerLetterFilename = generateCustomFilename(
      req.user.studentId,
      req.user.studentName,
      "offerLetter",
      file.originalname
    );

    // Upload offerLetter to Google Drive
    let offerLetterUrl;
    try {
      offerLetterUrl = await uploadFileToDrive(
        file,
        process.env.GOOGLE_DRIVE_FOLDER_ID,
        offerLetterFilename
      );
      // Delete local file after upload
      await deleteLocalFile(file.path);
    } catch (error) {
      logger.error("Error uploading offer letter:", error);
      // Clean up the local file if the upload fails
      if (file.path) {
        await deleteLocalFile(file.path);
      }
      return res.status(500).json({
        success: false,
        message: "Error uploading offer letter",
      });
    }

    // Create the internship status
    const internshipData = {
      ...req.body,
      student: student,
      studentName: studentName,
      offerLetter: offerLetterUrl,
    };

    const newStatus = await SummerInternshipStatus.create(internshipData);
    
    // Find the corresponding StudentInternship document
    const studentInternship = await StudentInternship.findOne({ student });

    if (!studentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }

    // Push the new internship status ObjectId into the summerInternshipStatus array
    studentInternship.summerInternshipStatus.push(newStatus._id);

    // Save the updated StudentInternship document
    await studentInternship.save();

    // Create notification for all admins
    await createAdminNotification(student, studentName, newStatus);
    

    logger.info(
      `[POST /api/summer-internship-status] Created ID: ${newStatus._id}`
    );

    res.status(201).json({
      success: true,
      data: newStatus,
    });
  } catch (error) {
    // Clean up uploaded files if an error occurs
    if (req.file?.path) {
      await deleteLocalFile(req.file.path);
    }
    next(error);
  }
};

// Helper function to create notification for all admins
const createAdminNotification = async (studentId, studentName, approval) => {
  try {
    // Get all admin users from the database
    const allAdmins = await Admins.find({});
    
    if (!allAdmins || allAdmins.length === 0) {
      logger.warn("[Notification] No admin users found to notify");
      return;
    }
    
    // Format recipients array for notification
    const recipients = allAdmins.map(admin => ({
      id: admin._id,
      model: "admin"
    }));
    
    // Create notification
    await Notification.createNotification({
      sender: {
        id: studentId,
        model: "student",
        name: studentName
      },
      recipients,
      title: "New Internship Status Submission",
      message: `${studentName} has submitted a Internship Status Submission}.`,
      type: "INTERNSHIP_STATUS_SUBMISSION",
      // link: `/admin/company-approvals/${approval._id}`, // Link to view the approval details
      priority: "medium"
    });
    
    logger.info(`[Notification] Sent company approval notification to ${allAdmins.length} admin(s)`);
  } catch (error) {
    logger.error(`[Notification] Error creating admin notification: ${error.message}`);
    // Don't throw the error as this is a secondary operation
  }
};

// @desc   Update an internship status
// @route  PUT /api/summer-internships/:id
exports.updateInternshipStatus = async (req, res, next) => {
  try {
    const updatedStatus = await SummerInternshipStatus.findByIdAndUpdate(
      { _id: req.params.id, isDeleted: false }, // Exclude soft-deleted records
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStatus || updatedStatus.isDeleted) {
      return res.status(404).json({ message: "Internship status not found" });
    }

    res.status(200).json(updatedStatus);
  } catch (error) {
    next(error);
  }
};

// @desc   Soft delete an internship status
// @route  DELETE /api/summer-internships/:id
exports.deleteInternshipStatus = async (req, res, next) => {
  try {
    const status = await SummerInternshipStatus.findById(req.params.id);

    if (!status || status.isDeleted) {
      return res
        .status(404)
        .json({ message: "Internship status not found or already deleted" });
    }

    status.isDeleted = true;
    status.deletedAt = new Date();
    await status.save();

    logger.info(`Internship status soft deleted: ${status._id}`);
    res.status(200).json({
      message: `Internship status ${status._id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Restore a soft-deleted internship status
// @route  PATCH /api/summer-internships/:id/restore
exports.restoreInternshipStatus = async (req, res, next) => {
  try {
    const status = await SummerInternshipStatus.findById(req.params.id);

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

    logger.info(`Internship status restored: ${status._id}`);
    res.status(200).json({
      success: true,
      message: `Internship status ${status._id} restored successfully`,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

