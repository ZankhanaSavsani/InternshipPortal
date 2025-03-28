import React, { useState, useEffect } from "react";
import { useAuth } from "../../layouts/AuthProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import {
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Save,
  Building,
  Users,
  Code,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";
import axios from "axios";

const CompanyApprovalForm = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [formData, setFormData] = useState({
    student: user?._id || "",
    studentName: user?.studentName || "",
    companyName: "",
    companyWebsite: "",
    companyAddress: "",
    numberOfEmployees: "",
    branches: [{ location: "" }],
    headOfficeAddress: "",
    stipendAmount: 0,
    hrDetails: {
      name: "",
      phone: "",
      email: "",
    },
    technologies: [""],
    currentProject: "",
    clients: [""],
    sourceOfCompany: "",
    reasonToChoose: "",
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

  const validateURL = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.error("URL validation error:", error);
      return false;
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

  const [errors, setErrors] = useState({});

  const steps = [
    {
      number: 1,
      title: "Basic Information",
      icon: <Building className="w-5 h-5" />,
    },
    { number: 2, title: "HR & Location", icon: <Users className="w-5 h-5" /> },
    {
      number: 3,
      title: "Technical Details",
      icon: <Code className="w-5 h-5" />,
    },
    {
      number: 4,
      title: "Additional Info",
      icon: <Briefcase className="w-5 h-5" />,
    },
  ];

  const handleChange = (field, value) => {
    if (field.startsWith("hrDetails.")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleBranchChange = (index, value) => {
    const newBranches = [...formData.branches];
    newBranches[index].location = value;
    handleChange("branches", newBranches);
  };

  const handleTechnologyChange = (index, value) => {
    const newTechnology = [...formData.technologies];
    newTechnology[index] = value;
    handleChange("technologies", newTechnology);
  };

  const handleClientChange = (index, value) => {
    const newClients = [...formData.clients];
    newClients[index] = value;
    handleChange("clients", newClients);
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.studentName.trim()) {
          newErrors.studentName = "Student name is required";
        }

        if (!formData.companyName.trim()) {
          newErrors.companyName = "Company name is required";
        }

        if (!formData.companyWebsite || !validateURL(formData.companyWebsite)) {
          newErrors.companyWebsite = "Valid company website URL is required";
        }

        if (!formData.companyAddress.trim()) {
          newErrors.companyAddress = "Company address is required";
        }

        if (!formData.numberOfEmployees || isNaN(formData.numberOfEmployees)) {
          newErrors.numberOfEmployees =
            "Number of employees is required and must be a number";
        } else if (formData.numberOfEmployees < 1) {
          newErrors.numberOfEmployees =
            "Number of employees must be greater than 0";
        }
        break;

      case 2:
        const stipendAmount = parseFloat(formData.stipendAmount);
        if (isNaN(stipendAmount)) {
          newErrors.stipendAmount = "Stipend amount must be a number";
        } else if (stipendAmount < 0) {
          newErrors.stipendAmount = "Stipend amount cannot be negative";
        }

        if (!formData.hrDetails.name.trim()) {
          newErrors["hrDetails.name"] = "HR name is required";
        }

        if (!formData.hrDetails.phone) {
          newErrors["hrDetails.phone"] = "HR phone is required";
        } else if (!validatePhone(formData.hrDetails.phone)) {
          newErrors["hrDetails.phone"] =
            "Please enter a valid phone number with at least 10 digits";
        }

        if (!formData.hrDetails.email) {
          newErrors["hrDetails.email"] = "HR email is required";
        } else if (!validateEmail(formData.hrDetails.email)) {
          newErrors["hrDetails.email"] = "Please enter a valid email address";
        }

        if (formData.branches.some((branch) => !branch.location.trim())) {
          newErrors.branches = "All branch locations must be filled";
        }

        if (!formData.headOfficeAddress.trim()) {
          newErrors.headOfficeAddress = "Head office address is required";
        }
        break;

      case 3:
        if (formData.technologies.length === 0 || !formData.technologies[0]) {
          newErrors.technologies = "At least one technology is required";
        } else if (formData.technologies.some((tech) => !tech.trim())) {
          newErrors.technologies = "All technology fields must be filled";
        }

        if (!formData.currentProject.trim()) {
          newErrors.currentProject = "Current project is required";
        }
        break;

      case 4:
        if (!formData.sourceOfCompany.trim()) {
          newErrors.sourceOfCompany = "Source of company is required";
        }

        if (!formData.reasonToChoose.trim()) {
          newErrors.reasonToChoose = "Reason is required";
        }

        if (formData.clients.some((client) => !client.trim())) {
          newErrors.clients = "All client fields must be filled";
        }
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
    const step1Fields = [
      "student",
      "studentName",
      "companyName",
      "companyWebsite",
      "companyAddress",
      "numberOfEmployees",
    ];
    const step2Fields = [
      "branches",
      "headOfficeAddress",
      "stipendAmount",
      "hrDetails.name",
      "hrDetails.phone",
      "hrDetails.email",
    ];
    const step3Fields = ["technologies", "currentProject"];

    if (
      step1Fields.includes(fieldName) ||
      (fieldName.startsWith("hrDetails") &&
        step1Fields.includes(fieldName.split(".")[1]))
    ) {
      return 1;
    } else if (
      step2Fields.includes(fieldName) ||
      (fieldName.startsWith("hrDetails") &&
        step2Fields.includes(fieldName.split(".")[1]))
    ) {
      return 2;
    } else if (step3Fields.includes(fieldName)) {
      return 3;
    }
    console.log(`Field ${fieldName} mapped to step 4 (default)`);
    return 4;
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
          stipendAmount: parseFloat(formData.stipendAmount),
          approvalStatus: "Pending",
        };

        console.log("Submission Data:", submissionData);

        const response = await axios.post(
          "/api/company-approvals",
          submissionData,
          { withCredentials: true }
        );

        console.log("Form submission successful:", response.data);
        setSubmitStatus("success");
        setSubmitMessage(
          response.data.message || "Form submitted successfully!"
        );

        // Reset form data
        setFormData({
          student: user?._id || "",
          studentName: user?.name || "",
          companyName: "",
          companyWebsite: "",
          companyAddress: "",
          numberOfEmployees: "",
          branches: [{ location: "" }],
          headOfficeAddress: "",
          stipendAmount: 0,
          hrDetails: {
            name: "",
            phone: "",
            email: "",
          },
          technologies: [""],
          currentProject: "",
          clients: [""],
          sourceOfCompany: "",
          reasonToChoose: "",
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

  const handleLogin = () => {
    console.log("Redirecting to login page");
    window.location.href = "/login";
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center w-full">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-1
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
                className="h-1 flex-1 mx-4 bg-gray-200"
                style={{
                  backgroundColor:
                    currentStep > step.number ? "#22c55e" : "#e5e7eb",
                }}
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

  const renderBasicInfo = () => (
    <div className="space-y-6">
      {!isAuthenticated && renderAuthNotice()}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name *
            </label>
            <Input
              value={formData.studentName}
              onChange={(e) => handleChange("studentName", e.target.value)}
              className={errors.studentName ? "border-red-500" : ""}
              placeholder="Enter your full name"
            />
            {errors.studentName && (
              <p className="text-red-500 text-sm mt-1">{errors.studentName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <Input
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              className={errors.companyName ? "border-red-500" : ""}
              placeholder="Enter company name"
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Website *
            </label>
            <Input
              type="url"
              name="companyWebsite" // Add a name attribute for the getStepForField function
              value={formData.companyWebsite}
              onChange={(e) => handleChange("companyWebsite", e.target.value)}
              className={errors.companyWebsite ? "border-red-500" : ""}
              placeholder="Enter company website"
            />
            {errors.companyWebsite && (
              <p className="text-red-500 text-sm mt-1">
                {errors.companyWebsite}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Address *
            </label>
            <Input
              value={formData.companyAddress}
              onChange={(e) => handleChange("companyAddress", e.target.value)}
              className={errors.companyAddress ? "border-red-500" : ""}
              placeholder="Enter complete company address"
            />
            {errors.companyAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.companyAddress}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Employees *
            </label>
            <Input
              type="number"
              value={formData.numberOfEmployees}
              onChange={(e) =>
                handleChange("numberOfEmployees", e.target.value)
              }
              className={errors.numberOfEmployees ? "border-red-500" : ""}
              placeholder="Enter number of employees"
              min="1"
            />
            {errors.numberOfEmployees && (
              <p className="text-red-500 text-sm mt-1">
                {errors.numberOfEmployees}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHRLocation = () => (
    <div className="space-y-6">
      {!isAuthenticated && renderAuthNotice()}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Branches *
            </label>
            {formData.branches.map((branch, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Branch Location"
                  value={branch.location}
                  onChange={(e) => handleBranchChange(index, e.target.value)}
                  className={errors.branches ? "border-red-500" : ""}
                />
                {formData.branches.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log(`Removing branch at index ${index}`);
                      handleChange(
                        "branches",
                        formData.branches.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <Minus size={16} />
                  </Button>
                )}
              </div>
            ))}
            {errors.branches && (
              <p className="text-red-500 text-sm mt-1">{errors.branches}</p>
            )}
            <Button
              type="button"
              onClick={() => {
                console.log("Adding new branch");
                handleChange("branches", [
                  ...formData.branches,
                  { location: "" },
                ]);
              }}
              className="w-full"
            >
              <Plus size={16} className="mr-2" /> Add Branch
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Head Office Address *
            </label>
            <Input
              value={formData.headOfficeAddress}
              onChange={(e) =>
                handleChange("headOfficeAddress", e.target.value)
              }
              className={errors.headOfficeAddress ? "border-red-500" : ""}
              placeholder="Enter head office address"
            />
            {errors.headOfficeAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.headOfficeAddress}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stipend Amount *
            </label>
            <Input
              type="number"
              value={formData.stipendAmount}
              onChange={(e) => handleChange("stipendAmount", e.target.value)}
              className={errors.stipendAmount ? "border-red-500" : ""}
              placeholder="Enter stipend amount"
              min="0"
              step="0.01"
            />
            {errors.stipendAmount && (
              <p className="text-red-500 text-sm mt-1">
                {errors.stipendAmount}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              HR Details
            </label>
            <Input
              placeholder="HR Name *"
              value={formData.hrDetails.name}
              onChange={(e) => handleChange("hrDetails.name", e.target.value)}
              className={errors["hrDetails.name"] ? "border-red-500" : ""}
            />
            {errors["hrDetails.name"] && (
              <p className="text-red-500 text-sm mt-1">
                {errors["hrDetails.name"]}
              </p>
            )}

            <Input
              placeholder="HR Phone * (min 10 digits, can include +, spaces, or hyphens)"
              type="tel"
              value={formData.hrDetails.phone}
              onChange={(e) => handleChange("hrDetails.phone", e.target.value)}
              className={errors["hrDetails.phone"] ? "border-red-500" : ""}
            />
            {errors["hrDetails.phone"] && (
              <p className="text-red-500 text-sm mt-1">
                {errors["hrDetails.phone"]}
              </p>
            )}

            <Input
              placeholder="HR Email *"
              type="email"
              value={formData.hrDetails.email}
              onChange={(e) => handleChange("hrDetails.email", e.target.value)}
              className={errors["hrDetails.email"] ? "border-red-500" : ""}
            />
            {errors["hrDetails.email"] && (
              <p className="text-red-500 text-sm mt-1">
                {errors["hrDetails.email"]}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTechnicalDetails = () => (
    <div className="space-y-6">
      {!isAuthenticated && renderAuthNotice()}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Technologies *
            </label>
            {formData.technologies.map((tech, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Technology"
                  value={tech}
                  onChange={(e) =>
                    handleTechnologyChange(index, e.target.value)
                  }
                  className={errors.technologies ? "border-red-500" : ""}
                />
                {formData.technologies.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log(`Removing technology at index ${index}`);
                      handleChange(
                        "technologies",
                        formData.technologies.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <Minus size={16} />
                  </Button>
                )}
              </div>
            ))}
            {errors.technologies && (
              <p className="text-red-500 text-sm mt-1">{errors.technologies}</p>
            )}
            <Button
              type="button"
              onClick={() => {
                console.log("Adding new technology");
                handleChange("technologies", [...formData.technologies, ""]);
              }}
              className="w-full"
            >
              <Plus size={16} className="mr-2" /> Add Technology
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Project *
            </label>
            <Input
              value={formData.currentProject}
              onChange={(e) => handleChange("currentProject", e.target.value)}
              className={errors.currentProject ? "border-red-500" : ""}
              placeholder="Enter current project"
            />
            {errors.currentProject && (
              <p className="text-red-500 text-sm mt-1">
                {errors.currentProject}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdditionalInfo = () => (
    <div className="space-y-6">
      {!isAuthenticated && renderAuthNotice()}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Clients *
            </label>
            {formData.clients.map((client, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Client Name"
                  value={client}
                  onChange={(e) => handleClientChange(index, e.target.value)}
                  className={errors.clients ? "border-red-500" : ""}
                />
                {formData.clients.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log(`Removing client at index ${index}`);
                      handleChange(
                        "clients",
                        formData.clients.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <Minus size={16} />
                  </Button>
                )}
              </div>
            ))}
            {errors.clients && (
              <p className="text-red-500 text-sm mt-1">{errors.clients}</p>
            )}
            <Button
              type="button"
              onClick={() => {
                console.log("Adding new client");
                handleChange("clients", [...formData.clients, ""]);
              }}
              className="w-full"
            >
              <Plus size={16} className="mr-2" /> Add Client
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source of Company *
            </label>
            <Input
              value={formData.sourceOfCompany}
              onChange={(e) => handleChange("sourceOfCompany", e.target.value)}
              className={errors.sourceOfCompany ? "border-red-500" : ""}
              placeholder="How did you find this company?"
            />
            {errors.sourceOfCompany && (
              <p className="text-red-500 text-sm mt-1">
                {errors.sourceOfCompany}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason to Choose This Company *
            </label>
            <Textarea
              value={formData.reasonToChoose}
              onChange={(e) => handleChange("reasonToChoose", e.target.value)}
              className={errors.reasonToChoose ? "border-red-500" : ""}
              placeholder="Why do you want to work with this company?"
            />
            {errors.reasonToChoose && (
              <p className="text-red-500 text-sm mt-1">
                {errors.reasonToChoose}
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
                  You'll need to provide your full name before continuing to the
                  Form.
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
      <Card className="w-full max-w-4xl mx-auto bg-gray-50 overflow-y-auto max-h-[90vh]">
        <CardHeader className="border-b bg-white sticky top-0 z-10">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Company Approval Form
          </CardTitle>
        </CardHeader>

        <CardContent className="items-center pt-6 overflow-y-auto">
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
            {currentStep === 1 && renderBasicInfo()}
            {currentStep === 2 && renderHRLocation()}
            {currentStep === 3 && renderTechnicalDetails()}
            {currentStep === 4 && renderAdditionalInfo()}
          </form>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-white sticky bottom-0 z-10 mt-6 p-6">
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isAuthenticated}
              className={`${
                !isAuthenticated
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
              <Save className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompanyApprovalForm;
