const Student = require("../models/StudentModel");
const StudentInternship = require("../models/StudentInternshipModel");
const { parseStudentIdRange, generateStudentIds } = require("../utils/rangeUtils");

/**
 * Middleware to validate if a range of student IDs overlaps with existing allocations.
 * Excludes soft-deleted documents.
 */
const validateRangeOverlap = async (req, res, next) => {
  const { range, semester } = req.body;

  try {
    // Parse the range and generate student IDs
    const { year, dept, startDigits, endDigits } = parseStudentIdRange(range);
    const studentIds = generateStudentIds(year, dept, startDigits, endDigits);

    // Find students in the range
    const students = await Student.find({ studentId: { $in: studentIds } });

    // Check if any student is already allocated to another guide in the same semester
    const existingInternships = await StudentInternship.find({
      student: { $in: students.map((student) => student._id) },
      semester,
      guide: { $ne: req.body.guideId }, // Exclude the current guide (if updating)
      isDeleted: false, // Exclude soft-deleted documents
    });

    if (existingInternships.length > 0) {
      const overlappingStudents = existingInternships.map(
        (internship) => internship.student.studentId
      );

      return res.status(400).json({
        success: false,
        message: "Range overlaps with existing allocations.",
        overlappingStudents,
      });
    }

    // If no overlap, proceed to the next middleware or route handler
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateRangeOverlap;