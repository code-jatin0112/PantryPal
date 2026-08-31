import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pantrypal_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for standardized error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = error.response?.data?.error || {
      message: error.message || "An unexpected network error occurred",
      code: "NETWORK_ERROR",
      status: error.response?.status || 500,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
