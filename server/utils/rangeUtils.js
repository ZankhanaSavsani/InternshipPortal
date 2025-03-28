// utils/rangeUtils.js

/**
 * Parses a student ID range string (e.g., "22cs078-22cs082").
 */
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
  
  /**
   * Generates an array of student IDs within a range.
   */
  function generateStudentIds(year, dept, startDigits, endDigits) {
    const studentIds = [];
    for (let i = startDigits; i <= endDigits; i++) {
      const digits = i.toString().padStart(3, "0"); // Ensure 3 digits (e.g., 078)
      studentIds.push(`${year}${dept}${digits}`);
    }
    return studentIds;
  }
  
  module.exports = { parseStudentIdRange, generateStudentIds };