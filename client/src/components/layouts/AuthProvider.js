import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';

// Create Auth Context
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const userCookie = Cookies.get('user');
      return userCookie ? JSON.parse(userCookie) : null;
    } catch (error) {
      console.error("Error parsing user cookie:", error);
      return null;
    }
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const authCookie = Cookies.get('isAuthenticated');
      return authCookie ? JSON.parse(authCookie) : false;
    } catch (error) {
      console.error("Error parsing isAuthenticated cookie:", error);
      return false;
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Logout function - define early to use in refreshToken
  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      Cookies.remove('user');
      Cookies.remove('isAuthenticated');
      navigate("/login");
    }
  }, [navigate]);

  // Refresh token function
  const refreshToken = useCallback(async (retries = 3) => {
    const attemptRefresh = async (retriesLeft) => {
      try {
        const response = await axios.post("/api/auth/refresh-token", {}, { withCredentials: true });
        return response.data.success;
      } catch (err) {
        console.error("Token refresh failed:", err);
        if (retriesLeft > 0) {
          console.log(`Retrying token refresh (${retriesLeft} attempts left)...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return attemptRefresh(retriesLeft - 1);
        }
        return false;
      }
    };
    
    return attemptRefresh(retries);
  }, []);

  // Function to check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get("/api/auth/me", { withCredentials: true });
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
          Cookies.set('isAuthenticated', JSON.stringify(true), { expires: 7 });
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();

    // Auto-refresh token every 15 minutes
    const tokenRefreshInterval = setInterval(async () => {
      const refreshed = await refreshToken();
      if (!refreshed) logout();
    }, 15 * 60 * 1000);

    return () => clearInterval(tokenRefreshInterval);
  }, [logout, refreshToken]);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/login", credentials, { withCredentials: true });
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
        Cookies.set('isAuthenticated', JSON.stringify(true), { expires: 7 });
        setError(null);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Setup Axios Interceptor for Automatic Token Refresh on 401 Errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes("/api/auth/login") &&
          !originalRequest.url.includes("/api/auth/refresh-token")
        ) {
          originalRequest._retry = true;
          const refreshed = await refreshToken();
          if (refreshed) return axios(originalRequest);
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [logout, refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        refreshToken,
        isAdmin: user?.role === "admin",
        isGuide: user?.role === "guide",
        isStudent: user?.role === "student",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;