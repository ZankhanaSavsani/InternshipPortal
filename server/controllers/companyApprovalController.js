const logger = require("../utils/logger");
const CompanyApprovalDetails = require("../models/CompanyApprovalFormModel");
const StudentInternship = require("../models/StudentInternshipModel");
const Admins = require("../models/AdminModel");
const Notification = require("../models/NotificationModel");
const Student = require("../models/StudentModel");


// @desc   Get a single company approval by ID (excluding soft-deleted records)
// @route  GET /api/company-approvals/:id
exports.getCompanyApprovalById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.error(`[GET /api/company-approvals/${req.params.id}] Invalid ID`);
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const approval = await CompanyApprovalDetails.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("student", "name email");

    if (!approval) {
      logger.error(`[GET /api/company-approvals/${req.params.id}] Not Found`);
      return res
        .status(404)
        .json({ success: false, message: "Approval record not found" });
    }

    res.status(200).json({ success: true, data: approval });
  } catch (error) {
    logger.error(
      `[GET /api/company-approvals/${req.params.id}] Error: ${error.message}`
    );
    next(error);
  }
};

// @desc   Get all company approvals with pagination, sorting, and filtering (including/excluding soft-deleted records)
// @route  GET /api/company-approvals
exports.getAllCompanyApprovals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Add a max limit
    const skip = (page - 1) * limit;

    // Dynamic sorting
    const sortField = req.query.sortBy || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;
    const sortOptions = { [sortField]: sortOrder };

    // Dynamic filtering
    const filterOptions = {};

    // Include/exclude soft-deleted records based on the `includeDeleted` query parameter
    if (req.query.includeDeleted !== "true") {
      filterOptions.isDeleted = false; // Exclude soft-deleted records by default
    }

    // Add filters for companyName, studentName, and status
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
    if (req.query.status) {
      filterOptions.approvalStatus = req.query.status; // Use approvalStatus directly
    }

    // Fetch approvals with filtering, sorting, and pagination
    const approvals = await CompanyApprovalDetails.find(filterOptions)
      .populate("student", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Count total documents matching the filter
    const total = await CompanyApprovalDetails.countDocuments(filterOptions);

    // Send response
    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: approvals,
    });
  } catch (error) {
    logger.error(`[GET /api/company-approvals] Error: ${error.message}`);
    next(error);
  }
};

// @desc   Create a new company approval request
// @route  POST /api/company-approvals
exports.createCompanyApproval = async (req, res, next) => {
  try {
    const student = req.user.id;
    const { studentName } = req.body;
    
    if (!student || !studentName) {
      logger.error("[POST /api/company-approvals] Invalid user!!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid user!!" });
    }
    
    // Add student and studentName to the request body
    const approvalData = {
      ...req.body,
      studentId: student, // Use _id as the student reference
      studentName: studentName, // Use the student's name from the user data
    };
    
    // Create the new approval
    const newApproval = await CompanyApprovalDetails.create(approvalData);
    
    // Find the corresponding StudentInternship document
    const studentInternship = await StudentInternship.findOne({ student });
    
    if (!studentInternship) {
      return res.status(404).json({
        success: false,
        message: "Student internship record not found.",
      });
    }
    
    // Push the new internship status ObjectId into the summerInternshipStatus array
    studentInternship.companyApprovalDetails.push(newApproval._id);
    
    // Save the updated StudentInternship document
    await studentInternship.save();
    
    // Create notification for all admins
    await createAdminNotification(student, studentName, newApproval);
    
    logger.info(`[POST /api/company-approvals] Created ID: ${newApproval._id}`);
    
    res.status(201).json({ success: true, data: newApproval });
  } catch (error) {
    logger.error(`[POST /api/company-approvals] Error: ${error.message}`);
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
      title: "New Company Approval Request",
      message: `${studentName} has submitted a company approval request for ${approval.companyName || 'a company'}.`,
      type: "COMPANY_APPROVAL_SUBMISSION",
      // link: `/admin/company-approvals/${approval._id}`, // Link to view the approval details
      priority: "medium"
    });
    
    logger.info(`[Notification] Sent company approval notification to ${allAdmins.length} admin(s)`);
  } catch (error) {
    logger.error(`[Notification] Error creating admin notification: ${error.message}`);
    // Don't throw the error as this is a secondary operation
  }
};

// @desc   Update a company approval request (excluding soft-deleted records)
// @route  PUT /api/company-approvals/:id
exports.updateCompanyApproval = async (req, res, next) => {
  try {
    const updatedApproval = await CompanyApprovalDetails.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedApproval) {
      logger.error(`[PUT /api/company-approvals/${req.params.id}] Not Found`);
      return res
        .status(404)
        .json({ success: false, message: "Approval record not found" });
    }

    logger.info(`[PUT /api/company-approvals/${req.params.id}] Updated`);
    res.status(200).json({ success: true, data: updatedApproval });
  } catch (error) {
    logger.error(
      `[PUT /api/company-approvals/${req.params.id}] Error: ${error.message}`
    );
    next(error);
  }
};

// @desc   Soft delete a company approval request
// @route  DELETE /api/company-approvals/:id
exports.deleteCompanyApproval = async (req, res, next) => {
  try {
    const approval = await CompanyApprovalDetails.findById(req.params.id);

    if (!approval || approval.isDeleted) {
      logger.error(
        `[DELETE /api/company-approvals/${req.params.id}] Not Found`
      );
      return res
        .status(404)
        .json({
          success: false,
          message: "Approval record not found or already deleted",
        });
    }

    approval.isDeleted = true;
    approval.deletedAt = new Date();
    await approval.save();

    logger.info(
      `[DELETE /api/company-approvals/${req.params.id}] Soft Deleted`
    );
    res
      .status(200)
      .json({ success: true, message: "Approval record deleted successfully" });
  } catch (error) {
    logger.error(
      `[DELETE /api/company-approvals/${req.params.id}] Error: ${error.message}`
    );
    next(error);
  }
};

// Update approval status and rejection reason with notifications
exports.updateApprovalStatus = async (req, res) => {
  const { id } = req.params;
  const { approvalStatus, rejectionReason, adminRemarks } = req.body;

  try {
    // Validate input
    if (!approvalStatus || !["Pending", "Approved", "Rejected"].includes(approvalStatus)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid approval status" 
      });
    }

    if (approvalStatus === "Rejected" && !rejectionReason) {
      return res.status(400).json({ 
        success: false,
        message: "Rejection reason is required for rejected status" 
      });
    }

    // Find and update the approval
    const companyApproval = await CompanyApprovalDetails.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { 
        approvalStatus,
        rejectionReason: approvalStatus === "Rejected" ? rejectionReason : null,
        adminRemarks: adminRemarks || undefined,
        statusUpdatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('student', 'studentId studentName email');

    if (!companyApproval) {
      return res.status(404).json({ 
        success: false,
        message: "Approval record not found" 
      });
    }

    // Send notification to student about status change
    await sendStatusChangeNotification(
      companyApproval.student._id,
      companyApproval.student.studentName,
      companyApproval.companyName,
      approvalStatus,
      rejectionReason,
      companyApproval._id
    );

    res.status(200).json({
      success: true,
      message: "Approval status updated successfully",
      data: companyApproval
    });

  } catch (error) {
    logger.error(`[PUT /api/company-approvals/${id}/status] Error: ${error.message}`);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

// Helper function to send status change notification
const sendStatusChangeNotification = async (studentId, studentName, companyName, status, reason, approvalId) => {
  try {
    let title, message, priority = "medium";
    
    if (status === "Approved") {
      title = "Company Approval Approved";
      message = `Your approval request for ${companyName} has been approved.`;
      priority = "high";
    } else if (status === "Rejected") {
      title = "Company Approval Rejected";
      message = `Your approval request for ${companyName} has been rejected.`;
      if (reason) message += ` Reason: ${reason}`;
      priority = "high";
    } else {
      title = "Company Approval Status Update";
      message = `Status updated for your approval request (${companyName}).`;
    }

    await Notification.createNotification({
      sender: {
        id: process.env.SYSTEM_ADMIN_ID || '000000000000000000000000', // Default system ID
        model: "Admin",
        name: "System Notification"
      },
      recipients: [{
        id: studentId,
        model: "Student"
      }],
      title,
      message,
      type: "COMPANY_APPROVAL_STATUS_CHANGE",
      link: `/student/company-approvals/${approvalId}`,
      priority,
      relatedEntity: {
        id: approvalId,
        model: "CompanyApproval"
      },
      statusChange: {
        to: status,
        ...(reason && { reason })
      }
    });

    logger.info(`Notification sent to student ${studentId} about approval status change`);
  } catch (error) {
    logger.error(`Error sending status change notification: ${error.message}`);
  }
};

// Enhanced create company approval with notification
// exports.createCompanyApproval = async (req, res, next) => {
//   try {
//     const studentId = req.user.id;
//     const { studentName } = req.body;
    
//     if (!studentId || !studentName) {
//       logger.error("[POST /api/company-approvals] Invalid user data");
//       return res.status(400).json({ 
//         success: false, 
//         message: "Student information required" 
//       });
//     }
    
//     // Verify student exists
//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Student not found" 
//       });
//     }

//     const approvalData = {
//       ...req.body,
//       student: studentId,
//       studentName: student.studentName || studentName
//     };
    
//     const newApproval = await CompanyApprovalDetails.create(approvalData);
    
//     // Update student internship record
//     await StudentInternship.findOneAndUpdate(
//       { student: studentId },
//       { $push: { companyApprovalDetails: newApproval._id } },
//       { upsert: true, new: true }
//     );
    
//     // Notify admins
//     await createAdminNotification(
//       studentId,
//       student.studentName || studentName,
//       newApproval
//     );
    
//     res.status(201).json({ 
//       success: true, 
//       data: newApproval 
//     });
//   } catch (error) {
//     logger.error(`[POST /api/company-approvals] Error: ${error.message}`);
//     next(error);
//   }
// };

// Enhanced admin notification helper
// const createAdminNotification = async (studentId, studentName, approval) => {
//   try {
//     const recipients = await Admins.find({})
//       .select('_id')
//       .then(admins => admins.map(admin => ({
//         id: admin._id,
//         model: "Admin"
//       })));

//     if (recipients.length > 0) {
//       await Notification.createNotification({
//         sender: {
//           id: studentId,
//           model: "Student",
//           name: studentName
//         },
//         recipients,
//         title: "New Company Approval Request",
//         message: `${studentName} submitted approval for ${approval.companyName}`,
//         type: "COMPANY_APPROVAL_SUBMISSION",
//         link: `/admin/company-approvals/${approval._id}`,
//         priority: "medium",
//         relatedEntity: {
//           id: approval._id,
//           model: "CompanyApproval"
//         }
//       });
//     }
//   } catch (error) {
//     logger.error(`Admin notification failed: ${error.message}`);
//   }
// };


// Update approval status and rejection reason
// exports.updateApprovalStatus = async (req, res) => {
//   const { id } = req.params; // Company approval ID
//   const { approvalStatus, rejectionReason,  adminRemarks } = req.body;

//   try {
//     // Validate input
//     if (
//       !approvalStatus ||
//       !["Pending", "Approved", "Rejected"].includes(approvalStatus)
//     ) {
//       return res.status(400).json({ message: "Invalid approval status" });
//     }

//     if (approvalStatus === "Rejected" && !rejectionReason) {
//       return res
//         .status(400)
//         .json({ message: "Rejection reason is required for rejected status" });
//     }

//     // Find the company approval by ID
//     const companyApproval = await CompanyApprovalDetails.findById(id);

//     if (!companyApproval) {
//       return res.status(404).json({ message: "Company approval not found" });
//     }

//     // Update the approval status and rejection reason
//     companyApproval.approvalStatus = approvalStatus;
//     companyApproval.rejectionReason =
//       approvalStatus === "Rejected" ? rejectionReason : null;

//     // Save the updated document
//     await companyApproval.save();

//     // Return success response
//     res.status(200).json({
//       message: "Approval status updated successfully",
//       data: companyApproval,
//     });
//   } catch (error) {
//     console.error("Error updating approval status:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// @desc   Restore a soft-deleted company approval
// @route  PATCH /api/company-approvals/:id/restore
exports.restoreCompanyApproval = async (req, res, next) => {
  try {
    const approval = await CompanyApprovalDetails.findOne({
      _id: req.params.id,
      isDeleted: true, // Only restore if it's soft-deleted
    });

    if (!approval) {
      logger.error(
        `[PATCH /api/company-approvals/${req.params.id}/restore] Not Found`
      );
      return res
        .status(404)
        .json({
          success: false,
          message: "Approval record not found or not soft-deleted",
        });
    }

    // Restore the record
    approval.isDeleted = false;
    approval.deletedAt = null;
    await approval.save();

    logger.info(
      `[PATCH /api/company-approvals/${req.params.id}/restore] Restored`
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Approval record restored successfully",
        data: approval,
      });
  } catch (error) {
    logger.error(
      `[PATCH /api/company-approvals/${req.params.id}/restore] Error: ${error.message}`
    );
    next(error);
  }
};

// Add to companyApprovalController.js

// @desc   Send notification to students by year/semester
// @route  POST /api/company-approvals/admin/notify/students
exports.sendNotificationToStudents = async (req, res) => {
  try {
    const { title, message, year, semester, priority = 'medium', link } = req.body;
    const sender = {
      id: req.user._id,
      model: "Admin",
      name: req.user.name || "System Admin",
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
      model: "Student",
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
    logger.error("Error sending notification to students:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc   Send notification to all guides
// @route  POST /api/company-approvals/admin/notify/guides
exports.sendNotificationToAllGuides = async (req, res) => {
  try {
    const { title, message, priority = 'medium', link } = req.body;
    const sender = {
      id: req.user._id,
      model: "Admin",
      name: req.user.name || "System Admin",
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
      model: "Guide",
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
    logger.error("Error sending notification to guides:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
