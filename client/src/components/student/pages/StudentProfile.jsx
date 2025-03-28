import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Lock, User, Mail, GraduationCap, CalendarDays, IdCard, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "../../ui/alert";
import axios from "axios";
import { useAuth } from "../../layouts/AuthProvider";

const StudentProfile = () => {
  const { user } = useAuth(); // Get the authenticated user from the AuthProvider
  const [userData, setUserData] = useState({
    studentId: "",
    studentName: "",
    email: "",
    semester: 0,
    year: "",
    guide: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch student profile data on component mount
  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const response = await axios.get(`/api/students/${user._id}`, {
          withCredentials: true,
        });
        setUserData(response.data.data);
      } catch (error) {
        console.error("Error fetching student profile:", error);
      }
    };

    fetchStudentProfile();
  }, [user._id]);

  // Handle input changes for password fields
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate password change form
  const validatePasswordChange = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordChange()) return;

    setSaving(true);

    try {
      const response = await axios.patch(
        `/api/students/change-password/${user._id}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { withCredentials: true }
      );

      setShowSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response?.data?.message) {
        setPasswordErrors({ currentPassword: error.response.data.message });
      }
    } finally {
      setSaving(false);
    }
  };

  // InfoField component for displaying read-only fields
  const InfoField = ({ icon: Icon, label, value }) => (
    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
      <Icon className="mr-3 text-blue-500" />
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-xl hover:shadow-2xl transition-shadow duration-300 max-h-[90vh]">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-2xl font-bold text-gray-800 text-center flex items-center justify-center gap-2">
            <User className="text-blue-500" /> Student Profile
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-8 p-8">
          {/* Profile Information Section */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <User className="text-blue-500" /> Profile Details
              </h3>
              <div className="h-1 w-20 bg-blue-500 rounded"></div>
            </div>

            <div className="space-y-2">
              {/* Read-Only Fields */}
              <div className="space-y-1 bg-gray-50 rounded-lg p-1">
                <InfoField icon={IdCard} label="Student ID" value={userData.studentId} />
                <InfoField icon={User} label="Student Name" value={userData.studentName} />
                <InfoField icon={Mail} label="Email" value={userData.email} />
                <InfoField icon={GraduationCap} label="Semester" value={userData.semester} />
                <InfoField icon={CalendarDays} label="Year" value={userData.year} />
                {userData.guide && (
                  <InfoField icon={User} label="Guide/Mentor" value={userData.guide} />
                )}
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Lock className="text-blue-500" /> Change Password
              </h3>
              <div className="h-1 w-20 bg-blue-500 rounded"></div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-2">
              {[
                { label: "Current Password", field: "currentPassword", icon: Lock },
                { label: "New Password", field: "newPassword", icon: Lock },
                { label: "Confirm New Password", field: "confirmPassword", icon: Lock }
              ].map(({ label, field, icon: Icon }) => (
                <div key={field} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={passwordData[field]}
                      onChange={(e) => handlePasswordChange(field, e.target.value)}
                      className={`pl-10 ${
                        passwordErrors[field] 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                    <Icon 
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        passwordErrors[field] ? "text-red-400" : "text-gray-400"
                      }`} 
                      size={16} 
                    />
                  </div>
                  {passwordErrors[field] && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                      {passwordErrors[field]}
                    </p>
                  )}
                </div>
              ))}
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Change Password
                  </>
                )}
              </Button>
            </form>

            {showSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  Password changed successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;