import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import RejectionModal from "../RejectionModal"; // Import the RejectionModal component

const ManageWeeklyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [studentSearch, setStudentSearch] = useState("");
  const [reportWeek, setReportWeek] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);

  // State for rejection modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentReportId, setCurrentReportId] = useState(null);

  // State for viewing detailed report info
  const [selectedReport, setSelectedReport] = useState(null);

  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // State specifically for marks modal
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [marks, setMarks] = useState("");
  const [reportForMarks, setReportForMarks] = useState(null);

  // Fetch weekly reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        sortBy: sortField,
        order: sortOrder,
        includeDeleted: showDeleted,
      });

      if (studentSearch) {
        params.append("studentName", studentSearch);
      }

      if (reportWeek) {
        params.append("reportWeek", reportWeek);
      }

      if (statusFilter) {
        params.append("approvalStatus", statusFilter);
      }

      const response = await axios.get(
        `/api/weeklyReport?${params.toString()}`
      );
      setReports(response.data.data);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    sortField,
    sortOrder,
    studentSearch,
    reportWeek,
    statusFilter,
    showDeleted,
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Function to handle adding marks
  const handleAddMarks = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const marksValue = parseFloat(marks);
      if (isNaN(marksValue) || marksValue < 0 || marksValue > 10) {
        setError("Marks must be a number between 0 and 10.");
        return;
      }

      await axios.patch(`/api/weeklyReport/${reportForMarks._id}/marks`, {
        marks: marksValue,
      });

      // Optimistically update the UI
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === reportForMarks._id
            ? { ...report, marks: marksValue }
            : report
        )
      );

      // Show success message
      setSuccess("Marks updated successfully.");
      setShowMarksModal(false); // Close the modal
      setReportForMarks(null); // Clear the report for marks
    } catch (error) {
      console.error("Error updating marks:", error);
      setError(
        error.response?.data?.message ||
          "Failed to update marks. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Marks Modal Component - completely separate from the Details Modal
  const MarksModal = () => {
    if (!reportForMarks) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/70 backdrop-blur-sm overflow-y-auto py-10 transition-all duration-300">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 transform transition-all duration-300 border border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
            <h2 className="text-2xl font-bold text-slate-800">
              Add Marks for {reportForMarks.studentName}
            </h2>
            <button
              onClick={() => {
                setShowMarksModal(false);
                setReportForMarks(null);
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div>
              <p className="text-slate-700 mb-4">
                <span className="font-medium">Student:</span>{" "}
                {reportForMarks.studentName}
                <br />
                <span className="font-medium">Week:</span>{" "}
                {reportForMarks.reportWeek}
                <br />
                <span className="font-medium">Status:</span>{" "}
                {reportForMarks.approvalStatus}
              </p>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Marks (Out of 10)
              </label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="Enter marks (0-10)"
                className="w-full"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex justify-end gap-4 bg-slate-50">
            <Button
              onClick={() => {
                setShowMarksModal(false);
                setReportForMarks(null);
              }}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:ring-4 focus:ring-slate-100 rounded-lg transition-all duration-200 flex items-center shadow-sm border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMarks}
              disabled={actionLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 rounded-lg transition-all duration-200 flex items-center shadow-sm"
            >
              {actionLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
                  Updating...
                </span>
              ) : (
                "Update Marks"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Handle soft delete
  const handleDeleteReport = async (id) => {
    try {
      setActionLoading(true);
      setError(null);

      await axios.delete(`/api/weeklyReport/${id}`);

      // Optimistically update the UI
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === id ? { ...report, isDeleted: true } : report
        )
      );

      // Show success message
      setSuccess("Successfully deleted the weekly report.");

      // Refresh data
      await fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      setError(
        error.response?.data?.message ||
          "Failed to delete report. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle restore
  const handleRestoreReport = async (id) => {
    try {
      setActionLoading(true);
      setError(null);

      await axios.patch(`/api/weeklyReport/${id}/restore`);

      // Optimistically update the UI
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === id ? { ...report, isDeleted: false } : report
        )
      );

      // Show success message
      setSuccess("Successfully restored the weekly report.");

      // Refresh data
      await fetchReports();
    } catch (error) {
      console.error("Error restoring report:", error);
      setError(
        error.response?.data?.message ||
          "Failed to restore report. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update approval status
  const handleUpdateStatus = async (id, status, reason = null) => {
    try {
      setActionLoading(true);
      setError(null);

      const updateData = {
        approvalStatus: status,
        comments: reason,
      };
      console.log("Updating report with ID:", id);

      const response = await axios.patch(
        `/api/weeklyReport/${id}/approval`,
        updateData
      );

      // Optimistically update the UI
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === id
            ? { ...report, approvalStatus: status, comments: reason }
            : report
        )
      );

      // Show success message
      setSuccess(`Successfully ${status.toLowerCase()} the weekly report.`);

      // If we're in the details modal, close it
      if (selectedReport && selectedReport._id === id) {
        setSelectedReport({
          ...selectedReport,
          approvalStatus: status,
          comments: reason,
        });
      }

      // Refresh data
      await fetchReports();
    } catch (error) {
      console.error("Error updating status:", error);
      setError(
        error.response?.data?.message ||
          "Failed to update status. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Handle view details
  const handleViewDetails = (report) => {
    setSelectedReport(report);
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setSelectedReport(null);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Details Modal Component
  const DetailsModal = () => {
    if (!selectedReport) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/70 backdrop-blur-sm overflow-y-auto py-10 transition-all duration-300">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 transform transition-all duration-300 border border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Weekly Report Details
              </h2>
              <p className="text-slate-500 mt-1 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Submitted by{" "}
                <span className="font-medium text-slate-700 ml-1">
                  {selectedReport.studentName}
                </span>
              </p>
            </div>
          </div>
          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Information */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                  <span className="mr-2 bg-blue-100 p-1.5 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Report Information
                </h4>
                <div className="space-y-4">
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Project Title
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedReport.projectTitle}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Report Week
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      Week {selectedReport.reportWeek}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Status
                    </p>
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full inline-flex items-center mt-1 ${getStatusColor(
                        selectedReport.approvalStatus
                      )}`}
                    >
                      <span className="w-2 h-2 rounded-full mr-1.5 bg-current opacity-70"></span>
                      {selectedReport.approvalStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                  <span className="mr-2 bg-blue-100 p-1.5 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Student Information
                </h4>
                <div className="space-y-4">
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Student Name
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedReport.studentName}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Email
                    </p>
                    <p className="text-slate-800 break-words mt-1">
                      {selectedReport.student?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                <span className="mr-2 bg-blue-100 p-1.5 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </span>
                Report Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Objectives for the Week
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedReport.objectivesForWeek}
                      </p>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Tasks Completed
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedReport.tasksCompleted}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-4">
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Key Findings
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedReport.keyFindings}
                      </p>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Challenges Encountered
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedReport.challengesEncountered}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan for Next Week */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                <span className="mr-2 bg-blue-100 p-1.5 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </span>
                Plan for Next Week
              </h4>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-800">
                  {selectedReport.planForNextWeek}
                </p>
              </div>
            </div>

            {/* Comments and Marks */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                <span className="mr-2 bg-blue-100 p-1.5 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </span>
                Comments and Marks
              </h4>
              <div className="space-y-4">
                <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                  <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                    Comments
                  </p>
                  <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                    {selectedReport.comments || "No comments provided."}
                  </p>
                </div>
                <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                  <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                    Marks
                  </p>
                  <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                    {selectedReport.marks || "No marks provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex flex-wrap items-center justify-end gap-4 bg-slate-50">
            {/* Close Button */}
            <Button
              onClick={handleCloseDetailsModal}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:ring-4 focus:ring-slate-100 rounded-lg transition-all duration-200 flex items-center shadow-sm border border-slate-300"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl text-gray-700">
            Weekly Reports Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification Area */}
          {error && (
            <Alert variant="destructive" className="mb-4 animate-slideDown">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <button
                onClick={() => setError(null)}
                className="absolute top-2 right-2 text-red-800 hover:text-red-900"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200 animate-slideDown">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
              <button
                onClick={() => setSuccess(null)}
                className="absolute top-2 right-2 text-green-800 hover:text-green-900"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by student name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search by report week..."
                value={reportWeek}
                onChange={(e) => setReportWeek(e.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
              {["", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status || "All Status"}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle to show/hide deleted records */}
          <div className="flex items-center mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={() => setShowDeleted((prev) => !prev)}
                className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
              />
              <span className="text-sm text-gray-700">
                Show Deleted Records
              </span>
            </label>
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("studentName")}
                  >
                    <div className="flex items-center">
                      Student Name
                      <SortIcon field="studentName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("reportWeek")}
                  >
                    <div className="flex items-center">
                      Report Week
                      <SortIcon field="reportWeek" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Date
                      <SortIcon field="createdAt" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marks</TableHead> {/* New Marks Column */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mr-3"></div>
                        <span className="text-lg font-medium text-gray-700">
                          Loading...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
                      <p className="text-lg font-medium text-gray-700">
                        No reports found
                      </p>
                      <p className="text-gray-500 mt-1">
                        Try changing your search or filters
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow
                      key={report._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                            {report.studentName.charAt(0)}
                          </div>
                          <span
                            className={
                              report.isDeleted
                                ? "line-through text-gray-500"
                                : ""
                            }
                          >
                            {report.studentName}
                          </span>
                          {report.isDeleted && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                              Deleted
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>Week {report.reportWeek}</TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            report.approvalStatus
                          )}`}
                        >
                          {report.approvalStatus === "Approved" ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : report.approvalStatus === "Rejected" ? (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 mr-1" />
                          )}
                          {report.approvalStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.marks !== undefined && report.marks !== null ? (
                          <span className="font-medium text-blue-600">
                            {report.marks}/10
                          </span>
                        ) : (
                          <span className="text-gray-500">Not graded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Add Marks Button */}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setMarks(report.marks || ""); // Initialize with existing marks if any
                              setReportForMarks(report); // Use separate state for marks modal
                              setShowMarksModal(true); // Open the marks modal
                            }}
                            disabled={actionLoading}
                            className="hover:bg-gray-200 transition-colors"
                          >
                            Add Marks
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {report.isDeleted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreReport(report._id)}
                              disabled={actionLoading}
                              className="hover:bg-gray-100 transition-colors"
                            >
                              Restore
                            </Button>
                          ) : (
                            <>
                              {report.approvalStatus === "Pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateStatus(report._id, "Approved")
                                    }
                                    disabled={actionLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                                  >
                                    {actionLoading &&
                                    currentReportId === report._id ? (
                                      <span className="flex items-center">
                                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
                                        Processing
                                      </span>
                                    ) : (
                                      "Approve"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setCurrentReportId(report._id);
                                      setShowRejectionModal(true);
                                    }}
                                    disabled={actionLoading}
                                    className="transition-colors hover:bg-red-700"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {(report.approvalStatus === "Approved" ||
                                report.approvalStatus === "Rejected") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleUpdateStatus(report._id, "Pending")
                                  }
                                  disabled={actionLoading}
                                  className="hover:bg-gray-100 transition-colors"
                                >
                                  Reset
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewDetails(report)}
                                className="hover:bg-gray-200 transition-colors"
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteReport(report._id)}
                                disabled={actionLoading}
                                className="hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </Button>
                              {/* {showMarksModal && <MarksModal />} */}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of{" "}
              {total} entries
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="hover:bg-gray-100 transition-colors"
                >
                  Previous
                </Button>
                <span className="py-2 px-4 bg-gray-100 rounded-md text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="hover:bg-gray-100 transition-colors"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Export and Print Buttons */}
          {reports.length > 0 && (
            <div className="mt-4 text-right">
              <Button
                onClick={() => {}}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 mr-2 flex items-center inline-flex"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Export to CSV
              </Button>
              <Button
                onClick={() => {}}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200 flex items-center inline-flex"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  ></path>
                </svg>
                Print View
              </Button>
            </div>
          )}

          {/* Render the modals */}
          <RejectionModal
            showRejectionModal={showRejectionModal}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            closeRejectionModal={() => setShowRejectionModal(false)}
            submitRejection={() => {
              handleUpdateStatus(currentReportId, "Rejected", rejectionReason);
              setShowRejectionModal(false);
            }}
            actionLoading={actionLoading}
          />
          <DetailsModal />
          {showMarksModal && <MarksModal />}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageWeeklyReports;
