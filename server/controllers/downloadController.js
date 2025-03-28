// downloadController.js
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const Admin = require('../models/AdminModel');
const Guide = require('../models/GuideModel');
const Student = require('../models/StudentModel');
const TokenBlacklist = require('../models/TokenBlacklist');
const CompanyApprovalDetails = require('../models/CompanyApprovalFormModel');
const SummerInternshipStatus = require('../models/SummerInternshipStatusFormModel');
const SummerInternshipCompletionStatus = require('../models/SummerInternshipCompletionFormModel');
const WeeklyReport = require('../models/WeeklyProgressReportModel');

// Model mapping with display names for better worksheet naming
const modelMapping = {
    student: { model: Student, displayName: 'Student' },
    admin: { model: Admin, displayName: 'Admin' },
    guide: { model: Guide, displayName: 'Guide' },
    tokenBlacklist: { model: TokenBlacklist, displayName: 'Token Blacklist' },
    companyApprovalDetails: { model: CompanyApprovalDetails, displayName: 'Company Approval Details' },
    summerInternshipStatus: { model: SummerInternshipStatus, displayName: 'Summer Internship Status' },
    summerInternshipCompletionStatus: { model: SummerInternshipCompletionStatus, displayName: 'Summer Internship Completion' },
    weeklyReport: { model: WeeklyReport, displayName: 'Weekly Report' }
};

// Custom error class for validation errors
class ValidationError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

// Helper Functions
const validateDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || !endDate) {
        throw new ValidationError("Start date and end date are required");
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError("Invalid date format");
    }

    if (start > end) {
        throw new ValidationError("Start date must be before end date");
    }

    return { start, end };
};

const sanitizeMongoData = (item) => {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(item)) {
        // Convert ObjectId to string
        if (value instanceof mongoose.Types.ObjectId) {
            sanitized[key] = value.toString();
        }
        // Convert Date objects to ISO string
        else if (value instanceof Date) {
            sanitized[key] = value.toISOString();
        }
        // Handle nested objects
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Skip if it's a Buffer
            if (!Buffer.isBuffer(value)) {
                sanitized[key] = sanitizeMongoData(value);
            }
        }
        // Handle arrays
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                item instanceof mongoose.Types.ObjectId ? 
                    item.toString() : 
                    (item && typeof item === 'object' ? 
                        sanitizeMongoData(item) : 
                        item
                    )
            );
        }
        // Regular values
        else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};

const formatColumnHeaders = (data) => {
    if (!data || !data.length) return [];
    
    const headers = Object.keys(data[0]).map(key => ({
        header: key.split('.').map(part => 
            part.replace(/([A-Z])/g, ' $1').trim()
        ).join(' - '),
        key: key,
        width: 15
    }));

    return headers;
};

const configureWorksheet = (worksheet, columns) => {
    worksheet.columns = columns;

    // Apply formatting to specific column types
    worksheet.columns.forEach(column => {
        if (column.header.toLowerCase().includes('date')) {
            column.numFmt = 'yyyy-mm-dd hh:mm:ss';
            column.width = 20;
        } else if (column.header.toLowerCase().includes('id')) {
            column.width = 25;
        }
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
};

const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9-_\.]/g, '_');
};

// Main controller function
const downloadData = async (req, res) => {
    try {
        const { model } = req.params;
        const { startDate, endDate } = req.query;

        // Validate model type
        if (!modelMapping[model]) {
            return res.status(400).json({ 
                error: "Invalid model type",
                validModels: Object.keys(modelMapping)
            });
        }

        // Validate date range
        const { start, end } = validateDateRange(startDate, endDate);

        // Fetch data with pagination
        const batchSize = 1000;
        let data = [];
        let skip = 0;
        let batch;

        do {
            batch = await modelMapping[model].model
                .find({
                    createdAt: { $gte: start, $lte: end }
                })
                .skip(skip)
                .limit(batchSize)
                .lean();

            const sanitizedBatch = batch.map(item => ({
                ID: item._id.toString(),
                ...sanitizeMongoData(item)
            }));

            data = data.concat(sanitizedBatch);
            skip += batchSize;
        } while (batch.length === batchSize);

        if (!data.length) {
            return res.status(404).json({ 
                error: "No data found",
                dateRange: { startDate, endDate }
            });
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Internship Management System';
        workbook.created = new Date();

        // Add worksheet
        const worksheet = workbook.addWorksheet(modelMapping[model].displayName);
        const columns = formatColumnHeaders(data);
        configureWorksheet(worksheet, columns);

        // Add data rows in batches
        const rowsPerBatch = 100;
        for (let i = 0; i < data.length; i += rowsPerBatch) {
            const batch = data.slice(i, i + rowsPerBatch);
            worksheet.addRows(batch);
        }

        // Add autofilter
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: columns.length }
        };

        // Set response headers
        const filename = sanitizeFilename(`${model}_data_${startDate}_to_${endDate}.xlsx`);
        res.setHeader(
            'Content-Type', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition', 
            `attachment; filename=${filename}`
        );

        // Write to response stream
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generating Excel:", error);
        res.status(error.status || 500).json({ 
            error: error.message || "Internal Server Error",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = { downloadData };