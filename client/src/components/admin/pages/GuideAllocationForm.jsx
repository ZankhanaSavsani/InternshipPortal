import React, { useState, useEffect } from "react";
import axios from "axios";
import { Loader, CheckCircle, AlertCircle, UserPlus, ArrowLeft, Users, Bookmark } from "lucide-react";
import { useAuth } from "../../layouts/AuthProvider";

const GuideAllocationForm = () => {
  const { isAuthenticated, user } = useAuth();
  const [startRange, setStartRange] = useState("");
  const [endRange, setEndRange] = useState("");
  const [guideId, setGuideId] = useState("");
  const [semester, setSemester] = useState(5);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);
  const [missingStudents, setMissingStudents] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rangeError, setRangeError] = useState("");

  // Fetch all guides for the dropdown
  useEffect(() => {
    const fetchGuides = async () => {
      if (!isAuthenticated) {
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        
        // Handle the response format you provided
        if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
          setGuides(response.data.data);
        } else {
          console.error("Unexpected API response format:", response.data);
          setSubmitStatus("error");
          setSubmitMessage("Failed to load guides: unexpected response format.");
        }
      } catch (error) {
        console.error("Error fetching guides:", error);
        setSubmitStatus("error");
        setSubmitMessage("Failed to load guides. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [isAuthenticated, user]);

  // Validate range fields
  const validateRange = () => {
    if (!startRange || !endRange) {
      setRangeError("Both start and end range are required");
      return false;
    }
    
    // Convert to lowercase for validation
    const startLower = startRange.toLowerCase();
    const endLower = endRange.toLowerCase();

    // Check if the format is correct (like 22cs078 or d23cs108)
    // This will match both formats: 22cs078 and d23cs108
    const formatRegex = /^[a-z]?\d{2}[a-z]{2}\d{3}$/;
    if (!formatRegex.test(startLower) || !formatRegex.test(endLower)) {
      setRangeError("Range format should be like 22cs078 or d23cs108");
      return false;
    }

    // Extract the department prefix (either 1 or 2 characters) + 2 digits + 2 letters
    // This will handle both "22cs" and "d23cs" formats
    const getDeptPrefix = (id) => {
      if (/^[a-z]\d{2}[a-z]{2}/.test(id)) {
        // Format like d23cs108
        return id.substring(0, 5);
      } else {
        // Format like 22cs078
        return id.substring(0, 4);
      }
    };

    const startPrefix = getDeptPrefix(startLower);
    const endPrefix = getDeptPrefix(endLower);

    // Check if the prefixes are the same
    if (startPrefix !== endPrefix) {
      setRangeError("Year and department must be the same in the range");
      return false;
    }
    
    // Extract the numeric part
    const getNumericPart = (id) => {
      return parseInt(id.substring(id.length - 3), 10);
    };

    // Check if startRange is less than endRange
    const startNum = getNumericPart(startLower);
    const endNum = getNumericPart(endLower);
    
    if (startNum >= endNum) {
      setRangeError("Start range must be less than end range");
      return false;
    }

    setRangeError("");
    return true;
  };

  // Handle changes in range fields
  const handleRangeChange = (field, value) => {
    // Store the value as entered (will be converted to lowercase later)
    if (field === "start") {
      setStartRange(value);
    } else {
      setEndRange(value);
    }
    
    // Clear error when typing
    if (rangeError) {
      setRangeError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      console.error("Submit attempt failed: User not authenticated");
      setSubmitStatus("error");
      setSubmitMessage("You must be logged in to submit this form.");
      return;
    }

    // Validate range format
    if (!validateRange()) {
      return;
    }

    // Convert to lowercase and create the range string in the format expected by the API
    const range = `${startRange.toLowerCase()}-${endRange.toLowerCase()}`;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide-allocation/allocate`,
        {
          range,
          guideId,
          semester
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      
      if (response.data && response.data.success) {
        setSubmitMessage("Guide allocated successfully!");
        setSubmitStatus("success");
        setMissingStudents(response.data.missingStudents || []);
        
        // Reset form
        setStartRange("");
        setEndRange("");
        setGuideId("");
      } else {
        throw new Error(response.data?.message || "Failed to allocate guide");
      }
    } catch (error) {
      setSubmitMessage(error.response?.data?.message || "Failed to allocate guide. Please try again.");
      setSubmitStatus("error");
      console.error("Allocation error:", error);
      setMissingStudents([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-100 to-blue-50">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md text-center border border-indigo-100 transition-all duration-300 hover:shadow-2xl">
          <div className="mb-6 text-indigo-600 bg-indigo-50 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto transform transition-transform duration-500 hover:rotate-12">
            <UserPlus className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-8">
            You must be logged in to access the guide allocation system.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Guide Allocation</h1>
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm transition duration-200 hover:bg-gray-50 border border-gray-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="mb-8 transform duration-300 ease-in-out shadow-md">
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-5">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Success!
                  </h3>
                  <p className="text-base text-green-700">{submitMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {submitStatus === "error" && (
          <div className="mb-8 transform duration-300 ease-in-out shadow-md">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Oops!</h3>
                  <p className="text-base text-red-700">{submitMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-xl shadow-md mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-full">
              <Bookmark className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Allocate Guide to Students</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID Range</label>
                <div className="flex space-x-2 items-center">
                  <input
                    type="text"
                    value={startRange}
                    onChange={(e) => handleRangeChange("start", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm"
                    placeholder="e.g., 22cs078"
                    required
                  />
                  <span className="text-gray-500 font-medium">to</span>
                  <input
                    type="text"
                    value={endRange}
                    onChange={(e) => handleRangeChange("end", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm"
                    placeholder="e.g., 22cs090"
                    required
                  />
                </div>
                {rangeError && (
                  <p className="text-sm text-red-500 mt-2 bg-red-50 p-2 rounded border-l-2 border-red-500">
                    {rangeError}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2 italic">Format: 22csXXX or d23csXXX (Same year and department)</p>
              </div>
              
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Guide</label>
                <select
                  value={guideId}
                  onChange={(e) => setGuideId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm appearance-none bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">Select a guide</option>
                  {guides.map((guide) => (
                    <option key={guide._id} value={guide._id}>
                      {guide.guideName} ({guide.username})
                    </option>
                  ))}
                </select>
                {loading && (
                  <div className="flex items-center mt-2 text-blue-600">
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-sm">Loading guides...</span>
                  </div>
                )}
              </div>
              
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm appearance-none bg-white"
                >
                  <option value={5}>5th Semester</option>
                  <option value={7}>7th Semester</option>
                </select>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 font-medium transition duration-300 flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Allocate Guide
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4 animate-bounce-once">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Loader className="h-6 w-6 text-indigo-600 animate-spin" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-800">Processing Request</p>
                <p className="text-sm text-gray-500">Please wait while we allocate the guide...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Display missing students if any */}
        {missingStudents.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <h3 className="font-medium text-lg">Missing Students</h3>
              </div>
              <p className="mb-3">The following student IDs were not found in the database:</p>
              <div className="bg-white p-4 rounded border border-yellow-200 max-h-40 overflow-y-auto">
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {missingStudents.map((id) => (
                    <li key={id} className="bg-yellow-100 px-3 py-1 rounded text-yellow-800 text-sm">
                      {id}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideAllocationForm;