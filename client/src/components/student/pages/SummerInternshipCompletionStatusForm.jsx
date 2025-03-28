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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Minus,
  Briefcase,
  FileText,
  Building2,
  Calendar,
  Upload,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";
import axios from "axios";

const SummerInternshipCompletionForm = () => {
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
    companyCity: "",
    companyAddress: "",
    modeOfInternship: "",
    typeOfInternship: "",
    technologies: [""],
    technologiesDetails: "",
    startDate: "",
    endDate: "",
    hrDetails: {
      name: "",
      phone: "",
      email: "",
    },
    stipendAmount: 0,
    stipendProof: null,
    completionCertificate: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?._id && user?.studentName) {
      setFormData((prev) => ({
        ...prev,
        student: user._id,
        studentName: user.studentName,
      }));
    }
  }, [user]);

  // Map fields to their respective steps
  const getStepForField = (fieldName) => {
    if (!fieldName) {
      console.error("Undefined field name passed to getStepForField");
      return 1; // Default to first step if field is undefined
    }

    const step1Fields = [
      "companyName",
      "companyWebsite",
      "companyCity",
      "companyAddress",
    ];
    const step2Fields = [
      "hrDetails.name",
      "hrDetails.phone",
      "hrDetails.email",
    ];
    const step3Fields = [
      "modeOfInternship",
      "typeOfInternship",
      "technologies",
      "technologiesDetails",
    ];
    const step4Fields = ["startDate", "endDate"];
    const step5Fields = [
      "stipendAmount",
      "stipendProof",
      "completionCertificate",
    ];

    if (step1Fields.includes(fieldName)) {
      return 1;
    } else if (step2Fields.includes(fieldName)) {
      return 2;
    } else if (step3Fields.includes(fieldName)) {
      return 3;
    } else if (step4Fields.includes(fieldName)) {
      return 4;
    } else if (step5Fields.includes(fieldName)) {
      return 5;
    }
    console.log(`Field ${fieldName} mapped to step 4 (default)`);
    return 4;
  };

  const validateURL = (url) => {
    if (!url || typeof url !== "string") return false; // Ensure the URL is a non-empty string
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.error("URL validation error:", error);
      return false;
    }
  };

  const steps = [
    {
      number: 1,
      title: "Company Details",
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      number: 2,
      title: "HR Details",
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      number: 3,
      title: "Internship Details",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      number: 4,
      title: "Duration",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      number: 5,
      title: "Documents",
      icon: <Upload className="w-5 h-5" />,
    },
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

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

  const handleHRChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      hrDetails: {
        ...prev.hrDetails,
        [field]: value,
      },
    }));

    if (errors[`hrDetails.${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`hrDetails.${field}`]: undefined,
      }));
    }
  };

  const handleTechnologyChange = (index, value) => {
    const newTechnology = [...formData.technologies];
    newTechnology[index] = value;
    handleChange("technologies", newTechnology);
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.companyName.trim()) {
          newErrors.companyName = "Company name is required";
        }
        if (!formData.companyWebsite || !validateURL(formData.companyWebsite)) {
          newErrors.companyWebsite = "Valid company website URL is required";
        }
        if (!formData.companyCity.trim()) {
          newErrors.companyCity = "Company city is required";
        }
        if (!formData.companyAddress.trim()) {
          newErrors.companyAddress = "Company address is required";
        }
        break;

      case 2:
        if (!formData.hrDetails.name.trim()) {
          newErrors["hrDetails.name"] = "HR name is required";
        }
        if (!validatePhone(formData.hrDetails.phone)) {
          newErrors["hrDetails.phone"] = "Invalid contact number";
        }
        if (!validateEmail(formData.hrDetails.email)) {
          newErrors["hrDetails.email"] = "Invalid email address";
        }
        break;

      case 3:
        const validmodeOfInternships = ["Offline", "Online", "Hybrid"];
        if (
          !formData.modeOfInternship ||
          !validmodeOfInternships.includes(formData.modeOfInternship)
        ) {
          newErrors.modeOfInternship = "Please select a valid internship mode";
        }
        const validtypeOfInternship = [
          "Development Project",
          "Inhouse/Research Project",
          "On technologies Training",
        ];
        if (
          !formData.typeOfInternship ||
          !validtypeOfInternship.includes(formData.typeOfInternship)
        ) {
          newErrors.typeOfInternship =
            "Please select a valid type Of Internship";
        }
        if (!formData.technologies[0]) {
          newErrors.technologies = "At least one technology is required";
        } else if (formData.technologies.some((tech) => !tech.trim())) {
          newErrors.technologies = "All technology fields must be filled";
        }
        if (!formData.technologiesDetails.trim()) {
          newErrors.technologiesDetails = "technologies Details is required";
        }
        break;
      case 4:
        if (!formData.startDate) {
          newErrors.startDate = "Start date is required";
        }
        if (!formData.endDate) {
          newErrors.endDate = "End date is required";
        }
        if (
          formData.startDate &&
          formData.endDate &&
          new Date(formData.startDate) > new Date(formData.endDate)
        ) {
          newErrors.endDate = "End date must be after start date";
        }
        break;

      case 5:
        if (!formData.stipendAmount || parseFloat(formData.stipendAmount) < 0) {
          newErrors.stipendAmount = "Valid stipend amount is required";
        }
        if (formData.stipendAmount > 0 && !formData.stipendProof) {
          newErrors.stipendProof =
            "Stipend proof is required when stipend amount is greater than zero";
        }
        if (!formData.completionCertificate) {
          newErrors.completionCertificate =
            "Completion Certificate is required";
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
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    } else {
      console.error(`Step ${currentStep} validation failed`);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setSubmitStatus(null);
    setSubmitMessage("");
  };

  const handleFileChange = (field, event) => {
    const file = event.target.files[0];
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
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

    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      try {
        // Initialize FormData
        const submissionData = new FormData();

        // Append all fields to FormData
        submissionData.append("student", user._id);
        submissionData.append("studentName", user.studentName);

        Object.keys(formData).forEach((key) => {
          if (key === "hrDetails") {
            Object.keys(formData.hrDetails).forEach((hrKey) => {
              submissionData.append(
                `hrDetails[${hrKey}]`,
                formData.hrDetails[hrKey]
              );
            });
          } else if (key === "technologies") {
            formData.technologies.forEach((tech, index) => {
              submissionData.append(`technologies[${index}]`, tech);
            });
          } else if (
            key === "stipendProof" ||
            key === "completionCertificate"
          ) {
            if (formData[key]) {
              submissionData.append(key, formData[key]);
            }
          } else {
            submissionData.append(key, formData[key]);
          }
        });

        // Debug: Log the keys in FormData to verify file inclusion
        const formDataKeys = [];
        for (let key of submissionData.keys()) {
          formDataKeys.push(key);
        }
        console.log("FormData keys:", formDataKeys);

        // Debug: Log the values in FormData
        console.log("FormData values:");
        for (let [key, value] of submissionData.entries()) {
          console.log(key, value);
        }

        // Send the request
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_BASEURL}/api/summer-internship-completion`,
          submissionData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        console.log("Form submission successful:", response.data);
        setSubmitStatus("success");
        setSubmitMessage(
          response.data.message || "Form submitted successfully!"
        );

        // Reset form data
        setFormData({
          student: user?._id || "",
          studentName: user?.studentName || "",
          companyName: "",
          companyWebsite: "",
          companyCity: "",
          companyAddress: "",
          modeOfInternship: "",
          typeOfInternship: "",
          technologies: [""],
          technologiesDetails: "",
          startDate: "",
          endDate: "",
          hrDetails: {
            name: "",
            phone: "",
            email: "",
          },
          stipendAmount: 0,
          stipendProof: null,
          completionCertificate: null,
        });
        setCurrentStep(1);
      } catch (error) {
        console.error("Form submission error:", error);
        console.error("Server response:", error.response?.data);
        setSubmitStatus("error");

        if (error.response?.data?.errors) {
          const backendErrors = {};
          const errorsArray = Array.isArray(error.response.data.errors)
            ? error.response.data.errors
            : [error.response.data.errors];

          errorsArray.forEach((err) => {
            if (err && err.field) {
              backendErrors[err.field] = err.message;
            }
          });

          if (Object.keys(backendErrors).length > 0) {
            console.error("Backend validation errors:", backendErrors);
            setErrors(backendErrors);

            const errorField = errorsArray[0]?.field;
            if (errorField) {
              const errorStep = getStepForField(errorField);
              console.log(
                `Navigating to step ${errorStep} for field ${errorField}`
              );
              setCurrentStep(errorStep);

              setTimeout(() => {
                const fieldElement = document.querySelector(
                  `[name="${errorField}"]`
                );
                if (fieldElement) {
                  fieldElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  fieldElement.focus();
                }
              }, 100);
            }
          } else {
            setSubmitMessage(
              error.response?.data?.message ||
                "An error occurred while submitting the form."
            );
          }
        } else {
          setSubmitMessage(
            error.response?.data?.message ||
              "An error occurred while submitting the form."
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.error("Form validation failed on submission");
    }
  };

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
        onClick={() => (window.location.href = "/login")} // Redirect to login page
        className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
      >
        Go to Login
      </Button>
    </div>
  );

  if (loading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-4xl mx-auto bg-gray-50 max-h-[90vh]">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Summer Internship Completion Form
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">{renderAuthNotice()}</CardContent>
        </Card>
      </div>
    );
  }

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

  const renderCompanyDetails = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
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
              Company City *
            </label>
            <Input
              value={formData.companyCity}
              onChange={(e) => handleChange("companyCity", e.target.value)}
              className={errors.companyCity ? "border-red-500" : ""}
              placeholder="Enter company city"
            />
            {errors.companyCity && (
              <p className="text-red-500 text-sm mt-1">{errors.companyCity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Address *
            </label>
            <Textarea
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
        </div>
      </div>
    </div>
  );

  const renderHR = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              HR Details
            </label>
            <Input
              placeholder="HR Name *"
              value={formData.hrDetails.name}
              onChange={(e) => handleHRChange("name", e.target.value)}
              className={errors["hrDetails.name"] ? "border-red-500" : ""}
            />
            {errors["hrDetails.name"] && (
              <p className="text-red-500 text-sm mt-1">
                {errors["hrDetails.name"]}
              </p>
            )}

            <Input
              placeholder="HR phone Number *"
              value={formData.hrDetails.phone}
              onChange={(e) => handleHRChange("phone", e.target.value)}
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
              onChange={(e) => handleHRChange("email", e.target.value)}
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

  const renderInternshipDetails = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Mode *
            </label>
            <Select
              value={formData.modeOfInternship}
              onValueChange={(value) => handleChange("modeOfInternship", value)}
            >
              <SelectTrigger
                className={errors.modeOfInternship ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select learning mode" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem
                  value="Offline"
                  className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                >
                  Offline
                </SelectItem>
                <SelectItem
                  value="Online"
                  className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                >
                  Online
                </SelectItem>
                <SelectItem
                  value="Hybrid"
                  className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                >
                  Hybrid
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.modeOfInternship && (
              <p className="text-red-500 text-sm mt-1">
                {errors.modeOfInternship}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type Of Internship *
            </label>
            <Select
              value={formData.typeOfInternship}
              onValueChange={(value) => handleChange("typeOfInternship", value)}
            >
              <SelectTrigger
                className={errors.typeOfInternship ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select type Of Internship" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem
                  value="Development Project"
                  className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                >
                  Development Project
                </SelectItem>
                <SelectItem
                  value="Inhouse/Research Project"
                  className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                >
                  Inhouse/Research Project
                </SelectItem>
                <SelectItem
                  value="On technologies Training"
                  className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                >
                  On technologies Training
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.typeOfInternship && (
              <p className="text-red-500 text-sm mt-1">
                {errors.typeOfInternship}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmed Technologies *
            </label>
            {formData.technologies.map((tech, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
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
                    onClick={() =>
                      handleChange(
                        "technologies",
                        formData.technologies.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Minus size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                handleChange("technologies", [...formData.technologies, ""])
              }
              className="w-full"
            >
              Add Technology
            </Button>
            {errors.technologies && (
              <p className="text-red-500 text-sm mt-1">{errors.technologies}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technologies Details *
            </label>
            <Textarea
              value={formData.technologiesDetails}
              onChange={(e) =>
                handleChange("technologiesDetails", e.target.value)
              }
              placeholder="Provide additional details about the technologies"
              className={`min-h-[100px] ${
                errors.technologiesDetails ? "border-red-500" : ""
              }`}
            />
            {errors.technologiesDetails && (
              <p className="text-red-500 text-sm mt-1">
                {errors.technologiesDetails}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDuration = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
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
            />
            {errors.stipendAmount && (
              <p className="text-red-500 text-sm mt-1">
                {errors.stipendAmount}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stipend Proof {formData.stipendAmount > 0 && "(Required)"}
            </label>
            <Input
              type="file"
              name="stipendProof" // Explicit name attribute
              onChange={(e) => handleFileChange("stipendProof", e)}
              accept=".pdf,.jpg,.jpeg,.png"
              className={errors.stipendProof ? "border-red-500" : ""}
            />
            {errors.stipendProof && (
              <p className="text-red-500 text-sm mt-1">{errors.stipendProof}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Certificate *
            </label>
            <Input
              type="file"
              name="completionCertificate" // Explicit name attribute
              onChange={(e) => handleFileChange("completionCertificate", e)}
              accept=".pdf,.jpg,.jpeg,.png"
              className={errors.completionCertificate ? "border-red-500" : ""}
            />
            {errors.completionCertificate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.completionCertificate}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
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
      {/* Submitting Overlay */}
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
            Summer Internship Completion Form
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 overflow-y-auto">
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
            {currentStep === 1 && renderCompanyDetails()}
            {currentStep === 2 && renderHR()}
            {currentStep === 3 && renderInternshipDetails()}
            {currentStep === 4 && renderDuration()}
            {currentStep === 5 && renderDocuments()}
          </form>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-white sticky bottom-0 z-10 mt-6 p-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
              <Save className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SummerInternshipCompletionForm;
