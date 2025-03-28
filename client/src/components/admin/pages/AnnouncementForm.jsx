import React, { useState } from "react";
import axios from "axios";
import { Bell, Send, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const AnnouncementForm = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    year: "",
    semester: "",
    priority: "medium",
    link: "",
    targetType: "students",
  });

  // State for form validation errors
  const [errors, setErrors] = useState({});

  // State for submission status
  const [submissionStatus, setSubmissionStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validation logic remains the same as previous implementation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    if (formData.targetType === "students") {
      if (!formData.year.trim()) {
        newErrors.year = "Year is required";
      }
      if (!formData.semester) {
        newErrors.semester = "Semester is required";
      }
    }

    if (
      formData.link &&
      !/^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(formData.link)
    ) {
      newErrors.link = "Invalid URL format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmissionStatus({ loading: true, success: false, error: null });

    try {
      if (formData.targetType === "students") {
        await axios.post(
          "/api/notifications/notify-students",
          {
            title: formData.title,
            message: formData.message,
            year: formData.year,
            semester: parseInt(formData.semester),
            priority: formData.priority,
            link: formData.link || null,
          },
          {
            withCredentials: true,
          }
        );
      } else {
        await axios.post(
          "/api/notifications/notify-guides",
          {
            title: formData.title,
            message: formData.message,
            priority: formData.priority,
            link: formData.link || null,
          },
          {
            withCredentials: true,
          }
        );
      }

      // Reset form and show success state
      setFormData({
        title: "",
        message: "",
        year: "",
        semester: "",
        priority: "medium",
        link: "",
        targetType: "students",
      });

      setSubmissionStatus({
        loading: false,
        success: true,
        error: null,
      });

      // Reset success state after 3 seconds
      setTimeout(() => {
        setSubmissionStatus({
          loading: false,
          success: false,
          error: null,
        });
      }, 3000);
    } catch (error) {
      console.error("Notification sending failed:", error);
      setSubmissionStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
  };

  // Priority configurations
  const priorityConfigs = {
    low: {
      color: "text-green-600 bg-green-50 ring-green-200",
      hoverColor: "hover:bg-green-100",
    },
    medium: {
      color: "text-amber-600 bg-amber-50 ring-amber-200",
      hoverColor: "hover:bg-amber-100",
    },
    high: {
      color: "text-red-600 bg-red-50 ring-red-200",
      hoverColor: "hover:bg-red-100",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bell className="w-8 h-8 animate-pulse" />
              <h2 className="text-2xl font-bold tracking-tight">
                Send Announcement
              </h2>
            </div>
            <div className="flex space-x-2">
              {["students", "guides"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, targetType: type }))
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 
                    ${
                      formData.targetType === type
                        ? "bg-white text-blue-600 shadow-md"
                        : "bg-blue-500/50 text-white hover:bg-blue-500/75"
                    }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center">
                Notification Title
                <span className="ml-2 text-gray-400 text-xs">Required</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-sm 
                    transition-all duration-300 
                    ${
                      errors.title
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 group-hover:border-blue-300"
                    }`}
                  placeholder="Enter notification title"
                />
                {errors.title && (
                  <AlertCircle className="absolute right-4 top-4 text-red-500 w-5 h-5 animate-bounce" />
                )}
              </div>
              {errors.title && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="mr-2 w-4 h-4" /> {errors.title}
                </p>
              )}
            </div>
            {/* <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                Notification Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.title
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter notification title"
                />
                {errors.title && (
                  <AlertCircle className="absolute right-3 top-2.5 text-red-500 w-4 h-4" />
                )}
              </div>
              {errors.title && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="mr-1.5 w-3 h-3" /> {errors.title}
                </p>
              )}
            </div> */}

            {/* Message Textarea */}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                Notification Message
              </label>
              <div className="relative">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.message
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Write your notification message"
                ></textarea>
                {errors.message && (
                  <AlertCircle className="absolute right-3 top-2.5 text-red-500 w-4 h-4" />
                )}
              </div>
              {errors.message && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="mr-1.5 w-3 h-3" /> {errors.message}
                </p>
              )}
            </div>

            {/* Conditional Fields for Students */}
            {formData.targetType === "students" && (
              <div className="grid grid-cols-2 gap-3">
                {/* Year Input */}
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                    Academic Year
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                        errors.year
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-200"
                      }`}
                      placeholder="2025-2026"
                    />
                    {errors.year && (
                      <AlertCircle className="absolute right-3 top-2.5 text-red-500 w-4 h-4" />
                    )}
                  </div>
                  {errors.year && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="mr-1.5 w-3 h-3" /> {errors.year}
                    </p>
                  )}
                </div>

                {/* Semester Select */}
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                    Semester
                  </label>
                  <div className="relative">
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                        errors.semester
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-200"
                      }`}
                    >
                      <option value="">Select Semester</option>
                      <option value="5">Semester 5</option>
                      <option value="7">Semester 7</option>
                    </select>
                    {errors.semester && (
                      <AlertCircle className="absolute right-3 top-2.5 text-red-500 w-4 h-4" />
                    )}
                  </div>
                  {errors.semester && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="mr-1.5 w-3 h-3" />{" "}
                      {errors.semester}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Optional Link Input */}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                Optional Link
                <span className="text-gray-500 text-xs ml-1.5">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.link
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="https://example.com"
                />
                {errors.link && (
                  <AlertCircle className="absolute right-3 top-2.5 text-red-500 w-4 h-4" />
                )}
              </div>
              {errors.link && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="mr-1.5 w-3 h-3" /> {errors.link}
                </p>
              )}
            </div>

            {/* Priority Select */}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["low", "medium", "high"].map((priority) => (
                  <label
                    key={priority}
                    className={`cursor-pointer p-2 rounded-lg text-center text-xs font-medium transition-all duration-300 ${
                      formData.priority === priority
                        ? `${
                            priorityConfigs[priority].color
                          } ring-2 ring-offset-2 ${
                            priority === "low"
                              ? "ring-green-200"
                              : priority === "medium"
                              ? "ring-amber-200"
                              : "ring-red-200"
                          }`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={handleChange}
                      className="hidden"
                    />
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button with Enhanced Feedback */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submissionStatus.loading || submissionStatus.success}
                className={`w-full flex items-center justify-center py-3 rounded-lg transition-all duration-300 
                  ${
                    submissionStatus.success
                      ? "bg-green-500 text-white"
                      : submissionStatus.loading
                      ? "bg-blue-500 text-white cursor-wait"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-50`}
              >
                {submissionStatus.success ? (
                  <>
                    <CheckCircle2 className="mr-2 w-5 h-5" />
                    Notification Sent
                  </>
                ) : submissionStatus.loading ? (
                  <>
                    <span className="mr-2">Sending</span>
                    <div className="animate-spin">
                      <Info className="w-5 h-5" />
                    </div>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 w-5 h-5" />
                    Send Notification
                  </>
                )}
              </button>
              {submissionStatus.error && (
                <div className="mt-2 text-center text-red-500 text-sm animate-pulse">
                  {submissionStatus.error}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;
