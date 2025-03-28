import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  CheckCircle,
  AlertCircle,
  Loader,
  Briefcase,
  Calendar,
  FileText,
  Building,
  Check,
  X,
  Clock,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../layouts/AuthProvider";

const StudentInternshipDetails = () => {
  const { user, isAuthenticated } = useAuth();

  // Search states
  const [studentId, setStudentId] = useState("");
  const [semester, setSemester] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Data states
  const [internshipData, setInternshipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [guides, setGuides] = useState([]);
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expansion states for sections
  const [expandedSections, setExpandedSections] = useState({
    weeklyReports: true,
    companyApproval: true,
    summerInternship: true,
    summerCompletion: true,
  });

  const [expandedReportIndex, setExpandedReportIndex] = React.useState(0);
  // Track if any expanded detail
  let latestSubmission = {};
  const [expandedDetailId, setExpandedDetailId] = React.useState(
    latestSubmission?._id
  );

  // Memoize fetchGuides using useCallback
  const fetchGuides = useCallback(async () => {
    try {
      const response = await axios.get("/api/guide", {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (
        response.data &&
        response.data.success === true &&
        response.data.data
      ) {
        setGuides(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch guides:", err);
    }
  }, [user.token]);

  // Fetch guides on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchGuides();
    }
  }, [isAuthenticated, fetchGuides]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchPerformed(true);

    if (!studentId || !semester) {
      setError("Please provide both Student ID and Semester");
      setInternshipData(null);
      return;
    }

    fetchInternshipData();
  };

  const fetchInternshipData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.get(
        `/api/studentInternship/student/${studentId}?semester=${semester}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (
        response.data &&
        response.data.success === true &&
        response.data.data
      ) {
        setInternshipData(response.data.data);
        if (response.data.data.guide) {
          setSelectedGuideId(response.data.data.guide._id);
        }
      } else {
        throw new Error("Invalid data format returned from API");
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("No internship record found for this student and semester");
      } else {
        setError(
          "Failed to fetch internship data: " +
            (err.response?.data?.message || err.message)
        );
      }
      console.error(err);
      setInternshipData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeGuide = async () => {
    if (!selectedGuideId) {
      setError("Please select a guide");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.put(
        `/api/studentInternship/${internshipData._id}/update-guide`,
        { guideId: selectedGuideId },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.success === true) {
        setSuccess("Guide updated successfully!");
        // Update the internship data with the new guide
        setInternshipData(response.data.data);
      } else {
        throw new Error("Invalid data format returned from API");
      }
    } catch (err) {
      setError(
        "Failed to update guide: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get status badge
  const StatusBadge = ({ status }) => {
    if (!status) return null;

    const statusStyles = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
    };

    const statusIcons = {
      Pending: <Clock className="w-4 h-4 mr-1" />,
      Approved: <Check className="w-4 h-4 mr-1" />,
      Rejected: <X className="w-4 h-4 mr-1" />,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-300"
        }`}
      >
        {statusIcons[status] || null}
        {status}
      </span>
    );
  };

  // Render section for weekly reports
  const renderWeeklyReports = () => {
    if (!internshipData?.weeklyReports?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">No weekly reports submitted yet</p>
          <p className="text-sm mt-2">
            Weekly progress will appear here once submitted
          </p>
        </div>
      );
    }

    // Calculate progress percentage across all weeks
    const calculateProgress = (reports) => {
      // Track unique weeks using a Set
      const uniqueWeeks = new Set(reports.map((report) => report.reportWeek));

      // Total number of weeks (e.g., 4 weeks)
      const totalWeeks = 4;

      // Progress per week (e.g., 25% per week)
      const progressPerWeek = 100 / totalWeeks;

      // Calculate progress based on unique weeks completed
      const progressPercentage = Math.min(
        100,
        uniqueWeeks.size * progressPerWeek
      );

      return progressPercentage;
    };

    const progressPercentage = calculateProgress(internshipData.weeklyReports);

    return (
      <div className="space-y-8">
        {/* Overall Progress Dashboard */}
        <div className="bg-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Internship Progress</h2>
            <div className="bg-white bg-opacity-20 px-4 py-1 rounded-full text-sm font-medium">
              {internshipData.weeklyReports.length}{" "}
              {/* {internshipData.weeklyReports.length === 1 ? "Week" : "Weeks"}{" "} */}
              Submission
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2 bg-white bg-opacity-20 rounded-full">
              <div
                className="h-2 bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 p-3 rounded-lg">
              <p className="text-xs opacity-75">Avg. Rating</p>
              <p className="text-xl font-bold">
                {internshipData.weeklyReports.filter((r) => r.marks !== null)
                  .length > 0
                  ? (
                      internshipData.weeklyReports.reduce(
                        (sum, r) => sum + (r.marks || 0),
                        0
                      ) /
                      internshipData.weeklyReports.filter(
                        (r) => r.marks !== null
                      ).length
                    ).toFixed(1)
                  : "N/A"}
              </p>
            </div>
            <div className="bg-white bg-opacity-10 p-3 rounded-lg">
              <p className="text-xs opacity-75">Last Report</p>
              <p className="text-xl font-bold">
                {internshipData.weeklyReports.length > 0
                  ? `Week ${
                      internshipData.weeklyReports[
                        internshipData.weeklyReports.length - 1
                      ].reportWeek
                    }`
                  : "N/A"}
              </p>
            </div>
            <div className="bg-white bg-opacity-10 p-3 rounded-lg">
              <p className="text-xs opacity-75">Challenges</p>
              <p className="text-xl font-bold">
                {internshipData.weeklyReports.reduce(
                  (sum, report) =>
                    sum +
                    (report.challengesEncountered &&
                    report.challengesEncountered !== "N/A"
                      ? report.challengesEncountered.split("\n").length
                      : 0),
                  0
                )}
              </p>
            </div>
            <div className="bg-white bg-opacity-10 p-3 rounded-lg">
              <p className="text-xs opacity-75">Findings</p>
              <p className="text-xl font-bold">
                {internshipData.weeklyReports.reduce(
                  (sum, report) =>
                    sum +
                    (report.keyFindings && report.keyFindings !== "N/A"
                      ? report.keyFindings.split("\n").length
                      : 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Individual Weekly Reports */}
        {internshipData.weeklyReports.map((report, index) => {
          // Calculate week status
          const hasComments = report.comments && report.comments.length > 0;
          const isGraded = report.marks !== null;
          const isExpanded = expandedReportIndex === index;

          return (
            <div
              key={index}
              className={`group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition duration-300 ${
                isExpanded ? "shadow-lg" : ""
              }`}
            >
              {/* Header with expandable indicator */}
              <div
                className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 cursor-pointer"
                onClick={() => setExpandedReportIndex(isExpanded ? -1 : index)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full shadow-inner">
                    <span className="text-lg font-bold">
                      {report.reportWeek}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {report.projectTitle ||
                        `Week ${report.reportWeek} Report`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(report.reportWeekStart)} -{" "}
                      {formatDate(report.reportWeekEnd)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {isGraded && (
                    <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Marks: {report.marks}</span>
                    </div>
                  )}
                  {hasComments && (
                    <div className="text-blue-600">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Content sections - conditionally rendered based on expanded state */}
              {isExpanded && (
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Objectives for Week
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700">
                          {report.objectivesForWeek || "N/A"}
                        </div>
                      </div>

                      <div>
                        <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Tasks Completed
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700">
                          {report.tasksCompleted || "N/A"}
                        </div>
                      </div>

                      <div>
                        <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Key Findings
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700">
                          {report.keyFindings || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Challenges Encountered
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700">
                          {report.challengesEncountered || "N/A"}
                        </div>
                      </div>

                      <div>
                        <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-purple-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Plan For Next Week
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700">
                          {report.planForNextWeek || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guide Comments Section */}
                  {report.comments && (
                    <div className="mt-6">
                      <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                        <svg
                          className="w-4 h-4 mr-2 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Guide Comments
                      </h4>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-gray-700">
                        {report.comments}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render company approval details
  const renderCompanyApproval = () => {
    if (!internshipData?.companyApprovalDetails?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">
            No company approval details submitted yet
          </p>
          <p className="text-sm mt-2">
            Company approval details will appear here once submitted
          </p>
        </div>
      );
    }

    // Track latest submission and approval status for header section
    const latestSubmission =
      internshipData.companyApprovalDetails[
        internshipData.companyApprovalDetails.length - 1
      ];
    const approvalStatusCounts = internshipData.companyApprovalDetails.reduce(
      (acc, detail) => {
        acc[detail.approvalStatus] = (acc[detail.approvalStatus] || 0) + 1;
        return acc;
      },
      {}
    );

    const getStatusColor = (status) => {
      switch (status) {
        case "Approved":
          return "bg-green-500";
        case "Pending":
          return "bg-yellow-500";
        case "Rejected":
          return "bg-red-500";
        default:
          return "bg-gray-500";
      }
    };

    // Get latest company name
    const latestCompanyName = latestSubmission?.companyName || "Company";

    // Determine if there are multiple submissions
    const hasMultipleSubmissions =
      internshipData.companyApprovalDetails.length > 1;

    return (
      <div className="space-y-8">
        {/* Top Dashboard Card */}
        <div className="bg-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Company Approval Status</h2>
            <div className="bg-white bg-opacity-20 px-4 py-1 rounded-full text-sm font-medium">
              {internshipData.companyApprovalDetails.length}{" "}
              {internshipData.companyApprovalDetails.length === 1
                ? "Submission"
                : "Submissions"}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-shrink-0 h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm opacity-75">Latest Submission</p>
                <p className="text-xl font-bold">{latestCompanyName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Status</p>
                <p className="text-xl font-bold flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(
                      latestSubmission?.approvalStatus
                    )}`}
                  ></span>
                  {latestSubmission?.approvalStatus || "Unknown"}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Technologies</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.technologies?.length || 0}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Stipend</p>
                <p className="text-xl font-bold">
                  ₹{latestSubmission?.stipendAmount?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Employees</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.numberOfEmployees || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Status Summary Pills */}
          {hasMultipleSubmissions && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(approvalStatusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="px-3 py-1 bg-white bg-opacity-15 rounded-full text-sm font-medium"
                >
                  {status}: {count}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submission History Accordion */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 ml-1">
            Submission History
          </h3>

          {internshipData.companyApprovalDetails.map((detail, index) => {
            const isExpanded = expandedDetailId === detail._id;
            const isLatest =
              index === internshipData.companyApprovalDetails.length - 1;

            return (
              <div
                key={detail._id}
                className={`group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition duration-300 ${
                  isExpanded ? "shadow-lg" : ""
                } ${isLatest ? "ring-2 ring-indigo-200" : ""}`}
              >
                {/* Header with expandable indicator */}
                <div
                  className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 cursor-pointer"
                  onClick={() =>
                    setExpandedDetailId(isExpanded ? null : detail._id)
                  }
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 text-white rounded-full shadow-inner ${getStatusColor(
                        detail.approvalStatus
                      )}`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        {detail.companyName}
                        {isLatest && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                            Latest
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-3">
                          {detail.submittedDate
                            ? formatDate(detail.submittedDate)
                            : "No date"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            detail.approvalStatus === "Approved"
                              ? "bg-green-100 text-green-800"
                              : detail.approvalStatus === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {detail.approvalStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Content sections - conditionally rendered based on expanded state */}
                {isExpanded && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                            <svg
                              className="w-4 h-4 mr-2 text-indigo-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Company Information
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Website</p>
                                <a
                                  href={detail.companyWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate block"
                                >
                                  {detail.companyWebsite || "N/A"}
                                </a>
                              </div>
                              <div>
                                <p className="text-gray-600">Employees</p>
                                <p>{detail.numberOfEmployees || "N/A"}</p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <p className="text-gray-600">Company Address</p>
                              <p className="text-sm">
                                {detail.companyAddress || "N/A"}
                              </p>
                            </div>

                            <div className="mt-3">
                              <p className="text-gray-600">Head Office</p>
                              <p className="text-sm">
                                {detail.headOfficeAddress || "N/A"}
                              </p>
                            </div>

                            {detail.stipendAmount && (
                              <div className="mt-3">
                                <p className="text-gray-600">Stipend Amount</p>
                                <p className="text-sm font-medium">
                                  ₹{detail.stipendAmount?.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Technical Details
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div>
                              <p className="text-gray-600">Current Project</p>
                              <p className="text-sm">
                                {detail.currentProject || "N/A"}
                              </p>
                            </div>

                            {detail.technologies &&
                              detail.technologies.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-gray-600">Technologies</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {detail.technologies.map((tech, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs"
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {detail.clients && detail.clients.length > 0 && (
                              <div className="mt-3">
                                <p className="text-gray-600">Clients</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {detail.clients.map((client, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                                    >
                                      {client}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {detail.branches && detail.branches.length > 0 && (
                          <div>
                            <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                              <svg
                                className="w-4 h-4 mr-2 text-purple-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Branch Locations
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {detail.branches.map((branch, idx) => (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center text-sm"
                                  >
                                    <svg
                                      className="w-3 h-3 mr-2 text-purple-500"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {branch.location}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                            <svg
                              className="w-4 h-4 mr-2 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            HR Contact Information
                          </h4>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-600">Name</p>
                                <p className="font-medium">
                                  {detail.hrDetails?.name || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Phone</p>
                                <p className="font-medium">
                                  {detail.hrDetails?.phone || "N/A"}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-gray-600">Email</p>
                                <p className="font-medium">
                                  {detail.hrDetails?.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Approval status section */}
                        <div>
                          <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                            <svg
                              className="w-4 h-4 mr-2 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Approval Status
                          </h4>
                          <div
                            className={`p-4 rounded-lg border ${
                              detail.approvalStatus === "Approved"
                                ? "bg-green-50 border-green-100"
                                : detail.approvalStatus === "Pending"
                                ? "bg-yellow-50 border-yellow-100"
                                : "bg-red-50 border-red-100"
                            }`}
                          >
                            <div className="flex items-center mb-2">
                              <div
                                className={`w-4 h-4 rounded-full mr-2 ${getStatusColor(
                                  detail.approvalStatus
                                )}`}
                              ></div>
                              <span className="font-medium">
                                {detail.approvalStatus}
                              </span>
                            </div>

                            {detail.approvalDate && (
                              <div className="text-sm">
                                <p className="text-gray-600">Date</p>
                                <p>{formatDate(detail.approvalDate)}</p>
                              </div>
                            )}

                            {detail.rejectionReason && (
                              <div className="mt-2 text-sm">
                                <p className="text-gray-600">
                                  Rejection Reason
                                </p>
                                <p className="text-red-700">
                                  {detail.rejectionReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-3 mt-6">
                      {detail.approvalStatus === "Rejected" && (
                        <button
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 text-sm font-medium flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle resubmission logic
                          }}
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Resubmit Details
                        </button>
                      )}
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDetailId(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Improvement Tips Section */}
        {internshipData.companyApprovalDetails.some(
          (detail) => detail.approvalStatus === "Rejected"
        ) && (
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Tips for Approval
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Ensure company details are accurate and complete
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Verify HR contact information is correct
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Include relevant technologies that match your curriculum
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Address previous rejection reasons in your resubmission
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render summer internship status
  const renderSummerInternship = () => {
    if (!internshipData?.summerInternshipStatus?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">
            No summer internship status submitted yet
          </p>
          <p className="text-sm mt-2">
            Summer internship status will appear here once submitted
          </p>
        </div>
      );
    }

    // Track latest submission
    const latestSubmission =
      internshipData.summerInternshipStatus[
        internshipData.summerInternshipStatus.length - 1
      ];

    // Determine if there are multiple submissions
    const hasMultipleSubmissions =
      internshipData.summerInternshipStatus.length > 1;

    return (
      <div className="space-y-8">
        {/* Top Dashboard Card */}
        <div className="bg-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Summer Internship Status</h2>
            <div className="bg-white bg-opacity-20 px-4 py-1 rounded-full text-sm font-medium">
              {internshipData.summerInternshipStatus.length}{" "}
              {internshipData.summerInternshipStatus.length === 1
                ? "Submission"
                : "Submissions"}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-shrink-0 h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm opacity-75">Latest Submission</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.companyName || "Company"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Technologies</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.technologies?.length || 0}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Stipend</p>
                <p className="text-xl font-bold">
                  ₹{latestSubmission?.stipendAmount?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Mode</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.modeOfInternship || "N/A"}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Location</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.companyCity || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submission History Accordion */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 ml-1">
            Submission History
          </h3>

          {internshipData.summerInternshipStatus.map((status, index) => {
            const isExpanded = expandedDetailId === status._id;
            const isLatest =
              index === internshipData.summerInternshipStatus.length - 1;

            return (
              <div
                key={status._id}
                className={`group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition duration-300 ${
                  isExpanded ? "shadow-lg" : ""
                } ${isLatest ? "ring-2 ring-blue-200" : ""}`}
              >
                {/* Header with expandable indicator */}
                <div
                  className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 cursor-pointer"
                  onClick={() =>
                    setExpandedDetailId(isExpanded ? null : status._id)
                  }
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 text-white rounded-full shadow-inner bg-blue-500">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        {status.companyName}
                        {isLatest && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Latest
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-3">
                          {status.submittedDate
                            ? formatDate(status.submittedDate)
                            : "No date"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Content sections - conditionally rendered based on expanded state */}
                {isExpanded && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                            <svg
                              className="w-4 h-4 mr-2 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Company Information
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Website</p>
                                <a
                                  href={status.companyWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate block"
                                >
                                  {status.companyWebsite || "N/A"}
                                </a>
                              </div>
                              <div>
                                <p className="text-gray-600">Location</p>
                                <p>{status.companyCity || "N/A"}</p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <p className="text-gray-600">Company Address</p>
                              <p className="text-sm">
                                {status.companyAddress || "N/A"}
                              </p>
                            </div>

                            {status.stipendAmount && (
                              <div className="mt-3">
                                <p className="text-gray-600">Stipend Amount</p>
                                <p className="text-sm font-medium">
                                  ₹{status.stipendAmount?.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Technical Details
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div>
                              <p className="text-gray-600">
                                Type of Internship
                              </p>
                              <p className="text-sm">
                                {status.typeOfInternship || "N/A"}
                              </p>
                            </div>

                            {status.technologies &&
                              status.technologies.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-gray-600">Technologies</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {status.technologies.map((tech, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs"
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                            <div className="mt-3">
                              <p className="text-gray-600">
                                Technology Details
                              </p>
                              <p className="text-sm">
                                {status.technologiesDetails || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                            <svg
                              className="w-4 h-4 mr-2 text-purple-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            HR Contact Information
                          </h4>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-600">Name</p>
                                <p className="font-medium">
                                  {status.hrDetails?.name || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Phone</p>
                                <p className="font-medium">
                                  {status.hrDetails?.phone || "N/A"}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-gray-600">Email</p>
                                <p className="font-medium">
                                  {status.hrDetails?.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {status.offerLetter && (
                          <div>
                            <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                              <svg
                                className="w-4 h-4 mr-2 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Offer Letter
                            </h4>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                              <a
                                href={status.offerLetter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:underline"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Offer Letter
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDetailId(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render summer internship completion status
  const renderSummerCompletion = () => {
    if (!internshipData?.summerInternshipCompletionStatus?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">
            No summer internship completion status submitted yet
          </p>
          <p className="text-sm mt-2">
            Summer internship completion status will appear here once submitted
          </p>
        </div>
      );
    }

    // Track latest submission
    const latestSubmission =
      internshipData.summerInternshipCompletionStatus[
        internshipData.summerInternshipCompletionStatus.length - 1
      ];

    // Determine if there are multiple submissions
    const hasMultipleSubmissions =
      internshipData.summerInternshipCompletionStatus.length > 1;

    return (
      <div className="space-y-8">
        {/* Top Dashboard Card */}
        <div className="bg-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Summer Internship Completion</h2>
            <div className="bg-white bg-opacity-20 px-4 py-1 rounded-full text-sm font-medium">
              {internshipData.summerInternshipCompletionStatus.length}{" "}
              {internshipData.summerInternshipCompletionStatus.length === 1
                ? "Submission"
                : "Submissions"}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-shrink-0 h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm opacity-75">Latest Submission</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.companyName || "Company"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Technologies</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.technologies?.length || 0}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Stipend</p>
                <p className="text-xl font-bold">
                  ₹{latestSubmission?.stipendAmount?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Mode</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.modeOfInternship || "N/A"}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs opacity-75">Duration</p>
                <p className="text-xl font-bold">
                  {latestSubmission?.startDate && latestSubmission?.endDate
                    ? `${formatDate(latestSubmission.startDate)} - ${formatDate(
                        latestSubmission.endDate
                      )}`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submission History Accordion */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 ml-1">
            Submission History
          </h3>

          {internshipData.summerInternshipCompletionStatus.map(
            (status, index) => {
              const isExpanded = expandedDetailId === status._id;
              const isLatest =
                index ===
                internshipData.summerInternshipCompletionStatus.length - 1;

              return (
                <div
                  key={status._id}
                  className={`group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition duration-300 ${
                    isExpanded ? "shadow-lg" : ""
                  } ${isLatest ? "ring-2 ring-blue-200" : ""}`}
                >
                  {/* Header with expandable indicator */}
                  <div
                    className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 cursor-pointer"
                    onClick={() =>
                      setExpandedDetailId(isExpanded ? null : status._id)
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 text-white rounded-full shadow-inner bg-blue-500">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          {status.companyName}
                          {isLatest && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Latest
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-3">
                            {status.submittedDate
                              ? formatDate(status.submittedDate)
                              : "No date"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Content sections - conditionally rendered based on expanded state */}
                  {isExpanded && (
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                              <svg
                                className="w-4 h-4 mr-2 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Company Information
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Company Name</p>
                                  <p>
                                    {status.companyName !== "NA"
                                      ? status.companyName
                                      : "Not Applicable"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">
                                    Stipend Amount
                                  </p>
                                  <p>
                                    ₹
                                    {status.stipendAmount?.toLocaleString() ||
                                      "N/A"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Start Date</p>
                                  <p>{formatDate(status.startDate)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">End Date</p>
                                  <p>{formatDate(status.endDate)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                              <svg
                                className="w-4 h-4 mr-2 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Technical Details
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              {status.technologies &&
                                status.technologies.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-gray-600">
                                      Technologies
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {status.technologies.map((tech, idx) => (
                                        <span
                                          key={idx}
                                          className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs"
                                        >
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              <div className="mt-3">
                                <p className="text-gray-600">
                                  Technology Details
                                </p>
                                <p className="text-sm">
                                  {status.technologiesDetails || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="inline-flex items-center text-gray-700 font-medium mb-2">
                              <svg
                                className="w-4 h-4 mr-2 text-purple-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              HR Contact Information
                            </h4>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-gray-600">Name</p>
                                  <p className="font-medium">
                                    {status.hrDetails?.name || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Phone</p>
                                  <p className="font-medium">
                                    {status.hrDetails?.phone || "N/A"}
                                  </p>
                                </div>
                                <div className="sm:col-span-2">
                                  <p className="text-gray-600">Email</p>
                                  <p className="font-medium">
                                    {status.hrDetails?.email || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {status.stipendProof && (
                              <a
                                href={status.stipendProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <FileText className="mr-2 h-5 w-5" />
                                View Stipend Proof
                              </a>
                            )}

                            {status.completionCertificate && (
                              <a
                                href={status.completionCertificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <FileText className="mr-2 h-5 w-5" />
                                View Completion Certificate
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDetailId(null);
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="mb-6 text-blue-600">
            <Briefcase className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to access the internship details.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition duration-200 transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Student Internship Management
        </h1>
        <p className="text-blue-100 mt-2">
          Search and manage student internship details
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
          <User className="mr-2 h-5 w-5" />
          Find Student Internship
        </h2>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="w-full md:w-1/3">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter student ID"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Semester</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>
          </div>
          <div className="w-full md:w-1/3 flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>Search</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6">
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-6 bg-white rounded-lg shadow-md">
          <Loader className="h-6 w-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-700">Loading internship data...</span>
        </div>
      )}

      {/* Internship Details */}
      {!loading && searchPerformed && internshipData && (
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
              <BookOpen className="mr-2 h-5 w-5" />
              Basic Internship Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Semester</p>
                <p className="font-medium text-lg">{internshipData.semester}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">Current Guide</p>
                    <p className="font-medium">
                      {internshipData.guide
                        ? `${internshipData.guide.name} (${internshipData.guide.email})`
                        : "No guide assigned"}
                    </p>
                  </div>
                  {internshipData.isGuideManuallyAssigned && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                      Manually Assigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-700">
                  Update Guide Assignment
                </h3>
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-grow">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Select New Guide
                    </label>
                    <select
                      value={selectedGuideId}
                      onChange={(e) => setSelectedGuideId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a Guide</option>
                      {guides.map((guide) => (
                        <option key={guide._id} value={guide._id}>
                          {guide.name} ({guide.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleChangeGuide}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>Update Guide</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Reports Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("weeklyReports")}
            >
              <h2 className="text-xl font-semibold flex items-center text-blue-800">
                <Calendar className="mr-2 h-5 w-5" />
                Weekly Reports
              </h2>
              {expandedSections.weeklyReports ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.weeklyReports && (
              <div className="mt-4">{renderWeeklyReports()}</div>
            )}
          </div>

          {/* Company Approval Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("companyApproval")}
            >
              <h2 className="text-xl font-semibold flex items-center text-blue-800">
                <Building className="mr-2 h-5 w-5" />
                Company Approval Details
              </h2>
              {expandedSections.companyApproval ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.companyApproval && (
              <div className="mt-4">{renderCompanyApproval()}</div>
            )}
          </div>

          {/* Summer Internship Status */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("summerInternship")}
            >
              <h2 className="text-xl font-semibold flex items-center text-blue-800">
                <Briefcase className="mr-2 h-5 w-5" />
                Summer Internship Status
              </h2>
              {expandedSections.summerInternship ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.summerInternship && (
              <div className="mt-4">{renderSummerInternship()}</div>
            )}
          </div>

          {/* Summer Internship Completion */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("summerCompletion")}
            >
              <h2 className="text-xl font-semibold flex items-center text-blue-800">
                <CheckCircle className="mr-2 h-5 w-5" />
                Summer Internship Completion
              </h2>
              {expandedSections.summerCompletion ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.summerCompletion && (
              <div className="mt-4">{renderSummerCompletion()}</div>
            )}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loading && searchPerformed && !internshipData && !error && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-gray-400 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No Internship Data Found
          </h3>
          <p className="text-gray-600">
            No internship records available for the specified student and
            semester.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentInternshipDetails;
