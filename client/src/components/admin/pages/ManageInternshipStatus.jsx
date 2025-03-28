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
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";

const ManageInternshipStatus = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [companySearch, setCompanySearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [total, setTotal] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false); // State to toggle deleted records

  // State for viewing detailed internship info
  const [selectedInternship, setSelectedInternship] = useState(null);

  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Ref for print view
  const printRef = useRef();

  // Fetch internships with the `includeDeleted` parameter
  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        sortBy: sortField,
        order: sortOrder,
        includeDeleted: showDeleted, // Include soft-deleted records if toggled
      });

      if (companySearch) {
        params.append("companyName", companySearch);
      }

      if (typeFilter) {
        params.append("typeOfInternship", typeFilter);
      }

      const response = await axios.get(
        `/api/summer-internship-status?${params.toString()}`
      );
      setInternships(response.data.data);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching internships:", error);
      setError("Failed to load internships. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortOrder, companySearch, typeFilter, showDeleted]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleRestoreInternship = async (id) => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await axios.patch(
        `/api/summer-internship-status/${id}/restore`
      );

      // Optimistically update the UI
      setInternships((prevInternships) =>
        prevInternships.map((internship) =>
          internship._id === id
            ? { ...internship, isDeleted: false, deletedAt: null }
            : internship
        )
      );

      // Show success message
      setSuccess("Successfully restored the internship status.");

      // Refresh data
      await fetchInternships();
    } catch (error) {
      console.error("Error restoring internship:", error);
      setError(
        error.response?.data?.message ||
          "Failed to restore internship. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (internship) => {
    setSelectedInternship(internship);
  };

  const handleCloseDetailsModal = () => {
    setSelectedInternship(null);
  };

  const handleDeleteInternship = async (id) => {
    try {
      setActionLoading(true);
      setError(null);

      await axios.delete(`/api/summer-internship-status/${id}`);

      // Optimistically update the UI
      setInternships((prevInternships) =>
        prevInternships.filter((internship) => internship._id !== id)
      );

      // Show success message
      setSuccess("Successfully deleted the internship status.");

      // Refresh data
      await fetchInternships();
    } catch (error) {
      console.error("Error deleting internship:", error);
      setError(
        error.response?.data?.message ||
          "Failed to delete internship. Please try again."
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
    if (internships.length === 0) return;

    // Define CSV headers
    const headers = [
      "S.No",
      "Company Name",
      "Student",
      "Type of Internship",
      "Date Submitted",
    ];

    // Map data to CSV rows
    const data = internships.map((internship, index) => [
      index + 1,
      internship.companyName,
      internship.studentName || internship.student?.name || "N/A",
      internship.typeOfInternship,
      new Date(internship.createdAt).toLocaleDateString(),
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
      `internship_status_${new Date().toISOString().split("T")[0]}.csv`
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
          <title>Internship Status - Print View</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-header">
            <h1>Internship Status</h1>
            <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Company Name</th>
                <th>Student</th>
                <th>Type of Internship</th>
                <th>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${internships
                .map(
                  (internship, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${internship.companyName}</td>
                  <td>${
                    internship.studentName || internship.student?.name || "N/A"
                  }</td>
                  <td>${internship.typeOfInternship}</td>
                  <td>${new Date(
                    internship.createdAt
                  ).toLocaleDateString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="print-footer">
            <p>© ${new Date().getFullYear()} Internship Status System. All rights reserved.</p>
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
    if (!selectedInternship) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/70 backdrop-blur-sm overflow-y-auto py-10 transition-all duration-300">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 transform transition-all duration-300 border border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedInternship.companyName}
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
                Internship Status by{" "}
                <span className="font-medium text-slate-700 ml-1">
                  {selectedInternship.studentName ||
                    selectedInternship.student?.name ||
                    "N/A"}
                </span>
              </p>
            </div>
          </div>
          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Internship Information */}
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
                  Internship Information
                </h4>
                <div className="space-y-4">
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Company
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedInternship.companyName}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Student
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedInternship.studentName ||
                        selectedInternship.student?.name ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Date Submitted
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {new Date(
                        selectedInternship.createdAt
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Type of Internship
                    </p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedInternship.typeOfInternship}
                    </p>
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
                      {selectedInternship.companyWebsite ? (
                        <a
                          href={selectedInternship.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedInternship.companyWebsite}
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
                      {selectedInternship.companyAddress || "N/A"}
                    </p>
                  </div>
                  <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                      Company City
                    </p>
                    <p className="text-slate-800 mt-1">
                      {selectedInternship.companyCity || "N/A"}
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
                          {selectedInternship.hrDetails?.name || "N/A"}
                        </p>
                        <p className="mb-2">
                          <span className="font-semibold text-slate-600">
                            Phone:
                          </span>{" "}
                          {selectedInternship.hrDetails?.phone ? (
                            <a
                              href={`tel:${selectedInternship.hrDetails.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedInternship.hrDetails.phone}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-600">
                            Email:
                          </span>{" "}
                          {selectedInternship.hrDetails?.email ? (
                            <a
                              href={`mailto:${selectedInternship.hrDetails.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedInternship.hrDetails.email}
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
                        {selectedInternship.technologies?.length > 0 ? (
                          selectedInternship.technologies?.map((tech, idx) => (
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
                        Mode of Internship
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedInternship.modeOfInternship || "N/A"}
                      </p>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Stipend Amount
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedInternship.stipendAmount || "N/A"}
                      </p>
                    </div>
                    <div className="group hover:bg-blue-50 p-3 rounded-md transition-colors duration-200">
                      <p className="text-sm text-slate-500 group-hover:text-blue-600 font-semibold">
                        Offer Letter
                      </p>
                      <p className="text-slate-800 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                        {selectedInternship.offerLetter ? (
                          <a
                            href={selectedInternship.offerLetter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Offer Letter
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex flex-wrap items-center justify-end gap-4 bg-slate-50">
            {/* Delete Button */}
            <Button
              onClick={() => handleDeleteInternship(selectedInternship._id)}
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
              Delete
            </Button>
            {/* Restore Button */}
            {selectedInternship.isDeleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestoreInternship(selectedInternship._id)}
                disabled={actionLoading}
                className="hover:bg-gray-100 transition-colors"
              >
                Restore
              </Button>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl text-gray-700">
            Internship Status Management
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
                  placeholder="Search by company name..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
              {[
                "",
                "Development Project",
                "Inhouse/Research Project",
                "On Technology Training",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    typeFilter === type
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type || "All Types"}
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
              <span className="text-sm text-gray-700">Show Deleted Records</span>
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
                    onClick={() => handleSort("typeOfInternship")}
                  >
                    <div className="flex items-center">
                      Type of Internship
                      <SortIcon field="typeOfInternship" />
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
                ) : internships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
                      <p className="text-lg font-medium text-gray-700">
                        No internships found
                      </p>
                      <p className="text-gray-500 mt-1">
                        Try changing your search or filters
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  internships.map((internship) => (
                    <TableRow
                      key={internship._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                            {internship.companyName.charAt(0)}
                          </div>
                          <span
                            className={
                              internship.isDeleted ? "line-through text-gray-500" : ""
                            }
                          >
                            {internship.companyName}
                          </span>
                          {internship.isDeleted && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                              Deleted
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {internship.studentName ||
                          internship.student?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>{internship.typeOfInternship}</TableCell>
                      <TableCell>
                        {new Date(internship.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {internship.isDeleted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreInternship(internship._id)}
                              disabled={actionLoading}
                              className="hover:bg-gray-100 transition-colors"
                            >
                              Restore
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewDetails(internship)}
                            className="hover:bg-gray-200 transition-colors"
                          >
                            View Details
                          </Button>
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
          {internships.length > 0 && (
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
          <DetailsModal />
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageInternshipStatus;