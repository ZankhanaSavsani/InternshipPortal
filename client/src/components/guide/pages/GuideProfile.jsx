import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Lock, User, Mail, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "../../ui/alert";
import axios from "axios";
import { useAuth } from "../../layouts/AuthProvider";

const GuideProfile = () => {
  const { user } = useAuth(); // Get the authenticated guide from the AuthProvider
  const [guideData, setGuideData] = useState({
    username: "",
    guideName: "",
    email: "",
    role: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch guide profile data on component mount
  useEffect(() => {
    const fetchGuideProfile = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_BASEURL}/api/guide/${user._id}`, {
          withCredentials: true,
        });
        setGuideData(response.data.data);
      } catch (error) {
        console.error("Error fetching guide profile:", error);
      }
    };

    fetchGuideProfile();
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
      await axios.patch(
        `/api/guides/change-password/${user._id}`,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-xl hover:shadow-2xl transition-shadow duration-300 max-h-[90vh]">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-2xl font-bold text-gray-800 text-center flex items-center justify-center gap-2">
            <User className="text-blue-500" /> Guide Profile
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
                <InfoField icon={User} label="Username" value={guideData.username} />
                <InfoField icon={User} label="Guide Name" value={guideData.guideName} />
                <InfoField icon={Mail} label="Email" value={guideData.email} />
                <InfoField icon={User} label="Role" value={guideData.role} />
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

export default GuideProfile;