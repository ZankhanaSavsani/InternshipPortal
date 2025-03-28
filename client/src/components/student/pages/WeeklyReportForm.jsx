import React, { useState, useEffect } from "react";
import { useAuth } from "../../layouts/AuthProvider";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  ClipboardList,
  Calendar,
  Target,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import axios from "axios";

const WeeklyReportForm = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [formData, setFormData] = useState({
    student: user?._id || "",
    studentName: user?.studentName || "",
    projectTitle: "",
    reportWeek: "",
    reportWeekStart: "",
    reportWeekEnd: "",
    objectivesForWeek: "",
    tasksCompleted: "",
    keyFindings: "",
    challengesEncountered: "",
    planForNextWeek: "",
    approvalStatus: "Pending",
  });

  useEffect(() => {
    if (user?._id && user?.name) {
      setFormData((prev) => ({
        ...prev,
        student: user._id,
        studentName: user.studentName,
      }));
    }
  }, [user]);

  const [errors, setErrors] = useState({});

  const steps = [
    {
      number: 1,
      title: "Basic Information",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      number: 2,
      title: "Report Period",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      number: 3,
      title: "Progress Details",
      icon: <Target className="w-5 h-5" />,
    },
    {
      number: 4,
      title: "Analysis & Planning",
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.projectTitle)
          newErrors.projectTitle = "Project title is required";
        if (!formData.reportWeek)
          newErrors.reportWeek = "Report week is required";
        break;
      case 2:
        if (!formData.reportWeekStart)
          newErrors.reportWeekStart = "Start date is required";
        if (!formData.reportWeekEnd)
          newErrors.reportWeekEnd = "End date is required";
        if (
          formData.reportWeekStart &&
          formData.reportWeekEnd &&
          new Date(formData.reportWeekStart) > new Date(formData.reportWeekEnd)
        ) {
          newErrors.reportWeekEnd = "End date must be after start date";
        }
        break;
      case 3:
        if (!formData.objectivesForWeek)
          newErrors.objectivesForWeek = "Objectives are required";
        if (!formData.tasksCompleted)
          newErrors.tasksCompleted = "Tasks completed is required";
        break;
      case 4:
        if (!formData.keyFindings)
          newErrors.keyFindings = "Key findings are required";
        if (!formData.challengesEncountered)
          newErrors.challengesEncountered = "Challenges are required";
        if (!formData.planForNextWeek)
          newErrors.planForNextWeek = "Plan for next week is required";
        break;
      default:
        console.error("Unexpected case value:", step);
    }

    if (Object.keys(newErrors).length > 0) {
      console.error("Validation errors found:", newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      console.error(`Step ${currentStep} validation failed`);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setSubmitStatus(null);
    setSubmitMessage("");
  };

  const getStepForField = (fieldName) => {
    const step1Fields = ["projectTitle", "reportWeek"];
    const step2Fields = ["reportWeekStart", "reportWeekEnd"];
    const step3Fields = ["objectivesForWeek", "tasksCompleted"];
    const step4Fields = [
      "keyFindings",
      "challengesEncountered",
      "planForNextWeek",
    ];
    if (step1Fields.includes(fieldName)) {
      return 1;
    } else if (step2Fields.includes(fieldName)) {
      return 2;
    } else if (step3Fields.includes(fieldName)) {
      return 3;
    } else if (step4Fields.includes(fieldName)) {
      return 4;
    }

    console.warn(
      `Field "${fieldName}" does not belong to any step. Defaulting to step 1.`
    );
    return 1; // Default to step 1 if the field is not found
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      console.error("Submit attempt failed: User not authenticated");
      setSubmitStatus("error");
      setSubmitMessage("You must be logged in to submit this form.");
      return;
    }

    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      try {
        const submissionData = {
          ...formData,
          student: user._id, // Use user._id instead of user.studentId
          studentName: user.studentName,
          approvalStatus: "Pending",
        };

        console.log("Submission Data:", submissionData);

        const response = await axios.post("/api/weeklyReport", submissionData, {
          withCredentials: true,
        });

        console.log("Form submission successful:", response.data);
        setSubmitStatus("success");
        setSubmitMessage(
          response.data.message || "Form submitted successfully!"
        );

        // Reset form data
        setFormData({
          student: user?._id || "",
          studentName: user?.studentName || "",
          projectTitle: "",
          reportWeek: "",
          reportWeekStart: "",
          reportWeekEnd: "",
          objectivesForWeek: "",
          tasksCompleted: "",
          keyFindings: "",
          challengesEncountered: "",
          planForNextWeek: "",
          approvalStatus: "Pending",
        });
        setCurrentStep(1);
      } catch (error) {
        console.error("Form submission error:", error);
        setSubmitStatus("error");

        // Handle field validation errors
        if (error.response?.data?.errors) {
          const backendErrors = {};
          error.response.data.errors.forEach((err) => {
            backendErrors[err.field] = err.message;
          });
          console.error("Backend validation errors:", backendErrors);
          setErrors(backendErrors);

          // Scroll to the field with the error
          const fieldElement = document.querySelector(
            `[name="${error.response.data.errors[0].field}"]`
          );
          if (fieldElement) {
            const errorField = error.response.data.errors[0].field;
            const errorStep = getStepForField(errorField);
            console.log(
              `Navigating to step ${errorStep} for field ${errorField}`
            );
            setCurrentStep(errorStep);
            setTimeout(() => {
              fieldElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              fieldElement.focus();
            }, 100);
          } else {
            console.error(
              "Could not find field element for scroll:",
              error.response.data.errors[0].field
            );
          }
        }
        // Handle authentication errors
        else if (
          error.response?.data?.message ===
          "User ID not found. Please log in again."
        ) {
          console.error("Authentication error: Session expired");
          setSubmitMessage("Your session has expired. Please log in again.");
          // Force a logout to refresh the session
          // logout();
        }
        // Handle generic errors
        else {
          const errorMessage =
            error.response?.data?.message ||
            "An error occurred while submitting the form.";
          console.error("Generic submission error:", errorMessage, error);
          setSubmitMessage(errorMessage);
        }

        console.error("Error response data:", error.response?.data);
        console.error("Error response status:", error.response?.status);
        console.error("Error response headers:", error.response?.headers);
      } finally {
        setIsSubmitting(false);
        console.log("Form submission process completed");
      }
    } else {
      console.error("Form validation failed on submission");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleLogin = () => {
    console.log("Redirecting to login page");
    window.location.href = "/login";
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2
                  ${
                    currentStep === step.number
                      ? "bg-blue-900 border-blue-900 text-white"
                      : currentStep > step.number
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
              >
                {step.icon}
              </div>
              <span className="text-xs font-medium text-gray-600">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAuthNotice = () => (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <Lock className="text-amber-500 mr-2 w-5 h-5" />
        <div>
          <h3 className="font-medium text-amber-800">
            Authentication Required
          </h3>
          <p className="text-sm text-amber-700">
            You must be logged in to submit this form.
          </p>
        </div>
      </div>
      <Button
        onClick={handleLogin}
        className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
      >
        Go to Login
      </Button>
    </div>
  );

  if (loading) {
    console.log("Authentication loading state...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
            <p>Verifying your authentication status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <Input
              placeholder="Enter project title"
              value={formData.projectTitle}
              onChange={(e) => handleChange("projectTitle", e.target.value)}
              className={`${errors.projectTitle ? "border-red-500" : ""}`}
            />
            {errors.projectTitle && (
              <p className="text-red-500 text-sm mt-1">{errors.projectTitle}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Week *
            </label>
            <Select
              value={formData.reportWeek}
              onValueChange={(value) => handleChange("reportWeek", value)}
            >
              <SelectTrigger
                className={errors.reportWeek ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select Week " />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reportWeek && (
              <p className="text-red-500 text-sm mt-1">{errors.reportWeek}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Week Start *
            </label>
            <Input
              type="date"
              value={formData.reportWeekStart}
              onChange={(e) => handleChange("reportWeekStart", e.target.value)}
              className={errors.reportWeekStart ? "border-red-500" : ""}
            />
            {errors.reportWeekStart && (
              <p className="text-red-500 text-sm mt-1">
                {errors.reportWeekStart}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Week End *
            </label>
            <Input
              type="date"
              value={formData.reportWeekEnd}
              onChange={(e) => handleChange("reportWeekEnd", e.target.value)}
              className={errors.reportWeekEnd ? "border-red-500" : ""}
            />
            {errors.reportWeekEnd && (
              <p className="text-red-500 text-sm mt-1">
                {errors.reportWeekEnd}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectives for Week *
            </label>
            <Textarea
              placeholder="List your key objectives for this week"
              value={formData.objectivesForWeek}
              onChange={(e) =>
                handleChange("objectivesForWeek", e.target.value)
              }
              className={`${
                errors.objectivesForWeek ? "border-red-500" : ""
              } min-h-[120px]`}
            />
            {errors.objectivesForWeek && (
              <p className="text-red-500 text-sm mt-1">
                {errors.objectivesForWeek}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasks Completed *
            </label>
            <Textarea
              placeholder="Describe the tasks you completed"
              value={formData.tasksCompleted}
              onChange={(e) => handleChange("tasksCompleted", e.target.value)}
              className={`${
                errors.tasksCompleted ? "border-red-500" : ""
              } min-h-[120px]`}
            />
            {errors.tasksCompleted && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tasksCompleted}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      {!isAuthenticated && renderAuthNotice()}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Findings *
            </label>
            <Textarea
              placeholder="Share your key findings and insights"
              value={formData.keyFindings}
              onChange={(e) => handleChange("keyFindings", e.target.value)}
              className={`${
                errors.keyFindings ? "border-red-500" : ""
              } min-h-[100px]`}
            />
            {errors.keyFindings && (
              <p className="text-red-500 text-sm mt-1">{errors.keyFindings}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challenges Encountered *
            </label>
            <Textarea
              placeholder="Describe any challenges or obstacles faced"
              value={formData.challengesEncountered}
              onChange={(e) =>
                handleChange("challengesEncountered", e.target.value)
              }
              className={`${
                errors.challengesEncountered ? "border-red-500" : ""
              } min-h-[100px]`}
            />
            {errors.challengesEncountered && (
              <p className="text-red-500 text-sm mt-1">
                {errors.challengesEncountered}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan for Next Week *
            </label>
            <Textarea
              placeholder="Outline your plans and goals for next week"
              value={formData.planForNextWeek}
              onChange={(e) => handleChange("planForNextWeek", e.target.value)}
              className={`${
                errors.planForNextWeek ? "border-red-500" : ""
              } min-h-[100px]`}
            />
            {errors.planForNextWeek && (
              <p className="text-red-500 text-sm mt-1">
                {errors.planForNextWeek}
              </p>
            )}
          </div>
        </div>
      </div>
      {submitStatus && (
        <div
          className={`p-4 rounded-lg ${
            submitStatus === "success"
              ? "bg-green-100 border border-green-200"
              : "bg-red-100 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {submitStatus === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            )}
            <p
              className={`text-sm ${
                submitStatus === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {submitMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You must be logged in to access this page.
            </p>
            <Button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.studentName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Profile Incomplete
              </h1>
              <p className="text-gray-600 mt-2 mb-6">
                Please complete your profile to access all features
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-blue-800">
                  You'll need to provide your full name before continuing to the Form.
                </p>
              </div>
            </div>

            <button
              onClick={() => (window.location.href = "/student/onboarding")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center justify-center"
            >
              <span>Complete Your Profile</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="mt-6 text-center text-sm text-gray-500">
              This only takes a few seconds to complete
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Submitting...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mt-4"></div>
          </div>
        </div>
      )}
      <Card className="w-full max-w-4xl mx-auto bg-gray-50 max-h-[90vh]">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Weekly Progress Report{" "}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {renderStepIndicator()}
          {submitStatus === "success" && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700">{submitMessage}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </form>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-white mt-6 p-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-blue-900 hover:bg-blue-700 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit Report
              <Save className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default WeeklyReportForm;
