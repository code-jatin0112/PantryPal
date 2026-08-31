import apiClient from "./apiClient";

// Easily editable endpoint constants
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
};

export const authService = {
  /**
   * Log in user with credentials
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  /**
   * Register a new user account
   * @param {Object} userData - { name, email, password }
   */
  async register(userData) {
    const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, userData);
    return response.data;
  },
};

export default authService;
