import React from "react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";

const PasswordResetPage = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-md p-6 text-center">
        <Alert variant="default" className="space-y-4">
          <AlertTitle>Password Reset Restricted</AlertTitle>
          <AlertDescription>
            You cannot reset your password on this page. Please contact your
            organization's administrator for password assistance.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default PasswordResetPage;
