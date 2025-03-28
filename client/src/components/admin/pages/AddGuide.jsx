import React, { useState } from "react";
import {
  UserPlus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useAuth } from "../../layouts/AuthProvider";
import axios from "axios";

const AddGuide = () => {
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    guideName: "",
    email: "",
  });

  // const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      console.error("Submit attempt failed: User not authenticated");
      setSubmitStatus("error");
      setSubmitMessage("You must be logged in to submit this form.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide`,
        formData,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.success) {
        setSubmitStatus("success");
        setSubmitMessage(
          "Guide added successfully! An email with login credentials has been sent."
        );

        // Reset form after successful submission
        setFormData({
          username: "",
          guideName: "",
          email: "",
        });
      } else {
        setSubmitStatus("error");
        setSubmitMessage(response.data.message || "Failed to add Guide.");
      }
    } catch (error) {
      console.error("Error adding Guide:", error);
      // Handle specific error cases
      if (error.response?.data?.message?.includes("already exists")) {
        setSubmitMessage("This Guide already exists.");
      } else {
        setSubmitMessage("An error occurred. Please try again.");
      }
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-indigo-50">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md text-center border border-blue-100">
          <div className="mb-6 text-blue-600 bg-blue-50 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
            <UserPlus className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to access the student management system.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 transform hover:scale-105 shadow-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <p className="text-lg font-medium text-gray-800">Adding Guide...</p>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="mb-6 transform animate-bounce-in shadow-md">
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-5">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-green-800">
                    Success!
                  </h3>
                  <p className="text-sm text-green-700">{submitMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {submitStatus === "error" && (
          <div className="mb-6 transform animate-shake shadow-md">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-800">Oops!</h3>
                  <p className="text-sm text-red-700">{submitMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm transition duration-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Add New Guide
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guide Name
                </label>
                <input
                  type="text"
                  name="guideName"
                  value={formData.guideName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="block text-sm font-medium text-gray-700 mb-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Add Guide"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddGuide;