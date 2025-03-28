// components/layouts/ProtectedRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Spinner from "../common/Spinner"; // Ensure this exists

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner />; // Show a spinner while checking auth state
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // Redirect to login if not authenticated
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate dashboard based on the user's role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "guide":
        return <Navigate to="/guide" replace />;
      case "student":
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />; // Render the child routes if authenticated and authorized
};

export default ProtectedRoute;