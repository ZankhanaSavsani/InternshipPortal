import axios from "axios";

/**
 * Configure axios interceptors to automatically handle authentication
 * @param {Function} refreshTokens - Function to refresh tokens
 * @param {Function} logoutUser - Function to logout user when authentication fails
 */
export const setupAxiosInterceptors = (refreshTokens, logoutUser) => {
  // Create request interceptor to add withCredentials
  axios.interceptors.request.use(
    (config) => {
      // Add withCredentials to every request to ensure cookies are sent
      if (!config.withCredentials) {
        config.withCredentials = true;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Create response interceptor to handle 401 errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If error is 401 and not from an auth endpoint and not already retried
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/api/auth/login") &&
        !originalRequest.url?.includes("/api/auth/refresh-token")
      ) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshSuccess = await refreshTokens();
          
          // If refresh was successful, retry the original request
          if (refreshSuccess) {
            return axios(originalRequest);
          } else {
            // If refresh failed, logout user
            logoutUser();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // If token refresh throws error, logout user
          logoutUser();
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;