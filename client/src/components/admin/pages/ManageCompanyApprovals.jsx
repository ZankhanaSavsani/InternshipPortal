import React, { useState, useEffect, useRef, useCallback } from "react";
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
// import { Textarea } from "../../ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import RejectionModal from "../RejectionModal"; // Import the RejectionModal component

const ManageCompanyApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [companySearch, setCompanySearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);

  // State for rejection modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentApprovalId, setCurrentApprovalId] = useState(null);

  // State for viewing detailed approval info
  const [selectedApproval, setSelectedApproval] = useState(null);

  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // State for rejection reason in details modal
  const [showRejectionReasonInput, setShowRejectionReasonInput] =
    useState(false);
  const [detailsRejectionReason, setDetailsRejectionReason] =
    React.useState("");

  // Ref for print view
  const printRef = useRef();

  const rejectionReasonRef = React.useRef(null);
  const textareaRef = React.useRef(null);
  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        sortBy: sortField,
        order: sortOrder,
        includeDeleted: showDeleted,
      });

      if (companySearch) {
        params.append("companyName", companySearch);
      }

      if (studentSearch) {
        params.append("studentName", studentSearch);
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await axios.get(
        `/api/company-approvals?${params.toString()}`
      );
      setApprovals(response.data.data);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      setError("Failed to load approvals. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    sortField,
    sortOrder,
    companySearch,
    studentSearch,
    statusFilter,
    showDeleted,
  ]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Clear notifications after some time
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle soft delete
  const handleDeleteApproval = async (id) => {
    try {
      setActionLoading(true);
      setError(null);

      await axios.delete(`/api/company-approvals/${id}`);

      // Optimistically update the UI
      setApprovals((prevApprovals) =>
        prevApprovals.map((approval) =>
          approval._id === id ? { ...approval, isDeleted: true } : approval
        )
      );

      // Show success message
      setSuccess("Successfully deleted the company approval.");

      // Refresh data
      await fetchApprovals();
    } catch (error) {
      console.error("Error deleting approval:", error);
      setError(
        error.response?.data?.message ||
          "Failed to delete approval. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle restore
  const handleRestoreApproval = async (id) => {
    try {
      setActionLoading(true);
      setError(null);

      await axios.patch(`/api/company-approvals/${id}/restore`);

      // Optimistically update the UI
      setApprovals((prevApprovals) =>
        prevApprovals.map((approval) =>
          approval._id === id ? { ...approval, isDeleted: false } : approval
        )
      );

      // Show success message
      setSuccess("Successfully restored the company approval.");

      // Refresh data
      await fetchApprovals();
    } catch (error) {
      console.error("Error restoring approval:", error);
      setError(
        error.response?.data?.message ||
          "Failed to restore approval. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const openRejectionModal = (id) => {
    setCurrentApprovalId(id);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setCurrentApprovalId(null);
    setRejectionReason("");
  };

  const submitRejection = async () => {
    if (rejectionReason.trim()) {
      await handleUpdateStatus(currentApprovalId, "Rejected", rejectionReason);
      closeRejectionModal();
    }
  };

  const handleViewDetails = (approval) => {
    setSelectedApproval(approval);
  };

  const handleCloseDetailsModal = () => {
    setSelectedApproval(null);
  };

  const handleUpdateStatus = async (id, status, reason = null) => {
    try {
      setActionLoading(true);
      setError(null);

      const updateData = {
        approvalStatus: status,
      };

      if (reason && status === "Rejected") {
        updateData.rejectionReason = reason;
      }

      const response = await axios.patch(
        `/api/company-approvals/${id}`,
        updateData
      );

      // Optimistically update the UI
      setApprovals((prevApprovals) =>
        prevApprovals.map((approval) =>
          approval._id === id
            ? { ...approval, approvalStatus: status, rejectionReason: reason }
            : approval
        )
      );

      // Show success message
      setSuccess(
        `Successfully ${status.toLowerCase()} the company approval request.`
      );

      // If we're in the details modal, close it
      if (selectedApproval && selectedApproval._id === id) {
        setSelectedApproval({
          ...selectedApproval,
          approvalStatus: status,
          rejectionReason: reason,
        });
      }

      // Refresh data
      await fetchApprovals();
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

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Function to export data to CSV
  const exportToCSV = () => {
    if (approvals.length === 0) return;

    // Define CSV headers
    const headers = [
      "S.No",
      "Company Name",
      "Student",
      "Date Submitted",
      "Status",
    ];

    // Map data to CSV rows
    const data = approvals.map((approval, index) => [
      index + 1,
      approval.companyName,
      approval.studentName || approval.student?.name || "N/A",
      new Date(approval.createdAt).toLocaleDateString(),
      approval.approvalStatus,
    ]);

    // Combine headers and data
    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `company_approvals_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle print view
  const handlePrint = () => {
    const printContent = document.getElementById("printArea");
    const originalContents = document.body.innerHTML;

    // Create a styled print version
    const printStyles = `
      <style>
        body { font-family: Arial, sans-serif; }
        h1 { color: #1e40af; text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #e5e7eb; color: #4b5563; font-weight: bold; text-align: left; padding: 10px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .print-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .print-date { text-align: right; color: #6b7280; }
        .print-footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Company Approvals - Print View</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-header">
            <h1>Company Approvals</h1>
            <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Company Name</th>
                <th>Student</th>
                <th>Date Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${approvals
                .map(
                  (approval, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${approval.companyName}</td>
                  <td>${
                    approval.studentName || approval.student?.name || "N/A"
                  }</td>
                  <td>${new Date(approval.createdAt).toLocaleDateString()}</td>
                  <td>${approval.approvalStatus}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="print-footer">
            <p>© ${new Date().getFullYear()} Company Approvals System. All rights reserved.</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Add slight delay to ensure content is fully loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Details Modal Component
  const DetailsModal = () => {
    React.useEffect(() => {
      if (showRejectionReasonInput && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [showRejectionReasonInput]);

    useEffect(() => {
      if (textareaRef.current) {
        const length = detailsRejectionReason.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, [detailsRejectionReason]);

    if (!selectedApproval) return null;

    const handleRejectClick = () => {
      if (showRejectionReasonInput && detailsRejectionReason.trim()) {
        // If rejection reason is provided, submit the rejection
        handleUpdateStatus(
          selectedApproval._id,
          "Rejected",
          detailsRejectionReason
        );
        setShowRejectionReasonInput(false); // Hide the input field after submission
        setDetailsRejectionReason(""); // Clear the rejection reason
      } else {
        // If rejection reason input is not visible, show it
        setShowRejectionReasonInput(true);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/70 backdrop-blur-sm overflow-y-auto py-10 transition-all duration-300">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 transform transition-all duration-300 border border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedApproval.companyName}
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
                Company Approval Request by{" "}
                <span className="font-medium text-slate-700 ml-1">
                  {selectedApproval.studentName ||
                    selectedApproval.student?.name ||
                    "N/A"}
                </span>
              </p>
            </div>
          </div>
          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Information */}
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
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Request Information
                </h4>
                <div className="space-y-4">
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Company
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedApproval.companyName}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Student
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedApproval.studentName ||
                        selectedApproval.student?.name ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Date Submitted
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {new Date(selectedApproval.createdAt).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Status
                    </p>
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full inline-flex items-center mt-1 ${getStatusColor(
                        selectedApproval.approvalStatus
                      )}`}
                    >
                      <span className="w-2 h-2 rounded-full mr-1.5 bg-current opacity-70"></span>
                      {selectedApproval.approvalStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Details */}
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
                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1zM9 5v4h2V5H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Company Details
                </h4>
                <div className="space-y-4">
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Company Website
                    </p>
                    <p className="text-slate-800 break-words mt-1">
                      {selectedApproval.companyWebsite ? (
                        <a
                          href={selectedApproval.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedApproval.companyWebsite}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Company Address
                    </p>
                    <p className="text-slate-800 mt-1">
                      {selectedApproval.companyAddress || "N/A"}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Number of Employees
                    </p>
                    <p className="text-slate-800 mt-1">
                      {selectedApproval.numberOfEmployees || "N/A"}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Stipend Amount
                    </p>
                    <p className="text-slate-800 font-medium mt-1">
                      {selectedApproval.stipendAmount ? (
                        <span className="text-emerald-600 font-bold">
                          {selectedApproval.stipendAmount}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
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
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        HR Details
                      </p>
                      <div className="text-slate-800 p-4 bg-slate-50 rounded-lg border border-slate-200 mt-2 shadow-sm">
                        <p className="mb-2">
                          <span className="font-semibold text-slate-600">
                            Name:
                          </span>{" "}
                          {selectedApproval.hrDetails?.name || "N/A"}
                        </p>
                        <p className="mb-2">
                          <span className="font-semibold text-slate-600">
                            Phone:
                          </span>{" "}
                          {selectedApproval.hrDetails?.phone ? (
                            <a
                              href={`tel:${selectedApproval.hrDetails.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedApproval.hrDetails.phone}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-600">
                            Email:
                          </span>{" "}
                          {selectedApproval.hrDetails?.email ? (
                            <a
                              href={`mailto:${selectedApproval.hrDetails.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedApproval.hrDetails.email}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Technologies
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedApproval.technologies?.length > 0 ? (
                          selectedApproval.technologies?.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 shadow-sm"
                            >
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-4">
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Current Project
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedApproval.currentProject || "N/A"}
                      </p>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Clients
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedApproval.clients?.length > 0 ? (
                          selectedApproval.clients?.map((client, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-sm"
                            >
                              {client}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">N/A</span>
                        )}
                      </div>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Source of Company
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedApproval.sourceOfCompany || "N/A"}
                      </p>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Reason to Choose
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedApproval.reasonToChoose || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Branches Section */}
            {selectedApproval.branches &&
              selectedApproval.branches.length > 0 && (
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
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Branches
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedApproval.branches.map((branch, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white hover:shadow-md transition-all duration-200 flex items-center"
                      >
                        <span className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm text-slate-500 font-semibold">
                            Branch Location
                          </p>
                          <p className="text-slate-800 font-medium">
                            {branch.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Rejection Reason */}
            {selectedApproval.rejectionReason && (
              <div className="bg-rose-50 p-5 rounded-lg border border-rose-200 shadow-md">
                <h4 className="text-lg font-semibold text-rose-700 mb-4 flex items-center border-b border-rose-200 pb-3">
                  <span className="mr-2 bg-rose-100 p-1.5 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-rose-600"
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
                  Rejection Reason
                </h4>
                <div className="p-4 bg-white rounded-lg text-rose-700 border border-rose-200 shadow-sm">
                  {selectedApproval.rejectionReason}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex flex-wrap items-center justify-end gap-4 bg-slate-50">
            {selectedApproval.approvalStatus === "Pending" && (
              <>
                {/* Reject Button */}
                <Button
                  onClick={handleRejectClick}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 focus:ring-4 focus:ring-rose-100 rounded-lg transition-all duration-200 flex items-center shadow-sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
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
                  )}
                  Reject
                </Button>

                {/* Rejection Reason Input */}
                {showRejectionReasonInput && (
                  <div className="w-full">
                    <textarea
                      ref={textareaRef}
                      value={detailsRejectionReason}
                      onChange={(e) => {
                        setDetailsRejectionReason(e.target.value);
                      }}
                      placeholder="Enter rejection reason..."
                      className="w-full p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 shadow-sm text-slate-700 resize-none"
                      rows={3}
                      dir="ltr"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Please provide a detailed reason for rejection that will
                      be shared with the student.
                    </p>
                  </div>
                )}

                {/* Approve Button */}
                <Button
                  onClick={() =>
                    handleUpdateStatus(selectedApproval._id, "Approved")
                  }
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-100 rounded-lg transition-all duration-200 flex items-center shadow-sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
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
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  )}
                  Approve
                </Button>
              </>
            )}

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-gray-100 p-4 sm:p-8">
    <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="pb-6">
          <CardTitle className="text-center text-xl text-gray-700">
            Company Approvals Management
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
          <div className="space-y-6 mb-8">
  {/* Search Inputs - Now with proper spacing */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        placeholder="Search by company name..."
        value={companySearch}
        onChange={(e) => setCompanySearch(e.target.value)}
        className="pl-10"
      />
    </div>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        placeholder="Search by student name..."
        value={studentSearch}
        onChange={(e) => setStudentSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>

  {/* Status Filters - Now with more spacing above */}
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
    <div className="flex flex-wrap gap-2">
      {["", "Pending", "Approved", "Rejected"].map((status) => (
        <button
          key={status}
          onClick={() => setStatusFilter(status)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === status
              ? "bg-blue-700 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {status || "All Status"}
        </button>
      ))}
    </div>

    <div className="flex items-center space-x-2">
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
          <div
            className="border rounded-md overflow-hidden shadow-sm"
            id="printArea"
            ref={printRef}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("companyName")}
                  >
                    <div className="flex items-center">
                      Company Name
                      <SortIcon field="companyName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("studentName")}
                  >
                    <div className="flex items-center">
                      Student
                      <SortIcon field="studentName" />
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
                ) : approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
                      <p className="text-lg font-medium text-gray-700">
                        No approvals found
                      </p>
                      <p className="text-gray-500 mt-1">
                        Try changing your search or filters
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((approval) => (
                    <TableRow
                      key={approval._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                            {approval.companyName.charAt(0)}
                          </div>
                          <span
                            className={
                              approval.isDeleted
                                ? "line-through text-gray-500"
                                : ""
                            }
                          >
                            {approval.companyName}
                          </span>
                          {approval.isDeleted && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                              Deleted
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {approval.studentName ||
                          approval.student?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(approval.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            approval.approvalStatus
                          )}`}
                        >
                          {approval.approvalStatus === "Approved" ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : approval.approvalStatus === "Rejected" ? (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 mr-1" />
                          )}
                          {approval.approvalStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {approval.isDeleted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleRestoreApproval(approval._id)
                              }
                              disabled={actionLoading}
                              className="hover:bg-gray-100 transition-colors"
                            >
                              Restore
                            </Button>
                          ) : (
                            <>
                              {approval.approvalStatus === "Pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        approval._id,
                                        "Approved"
                                      )
                                    }
                                    disabled={actionLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                                  >
                                    {actionLoading &&
                                    currentApprovalId === approval._id ? (
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
                                    onClick={() =>
                                      openRejectionModal(approval._id)
                                    }
                                    disabled={actionLoading}
                                    className="transition-colors hover:bg-red-700"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {(approval.approvalStatus === "Approved" ||
                                approval.approvalStatus === "Rejected") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleUpdateStatus(approval._id, "Pending")
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
                                onClick={() => handleViewDetails(approval)}
                                className="hover:bg-gray-200 transition-colors"
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteApproval(approval._id)
                                }
                                disabled={actionLoading}
                                className="hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </Button>
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
          {approvals.length > 0 && (
            <div className="mt-4 text-right">
              <Button
                onClick={exportToCSV}
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
                onClick={handlePrint}
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
            closeRejectionModal={closeRejectionModal}
            submitRejection={submitRejection}
            actionLoading={actionLoading}
          />
          <DetailsModal />
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageCompanyApprovals;
