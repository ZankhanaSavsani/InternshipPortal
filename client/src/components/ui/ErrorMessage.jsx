import React from "react";
import { AlertCircle } from "lucide-react";

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="flex items-center justify-center p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm">
      <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;