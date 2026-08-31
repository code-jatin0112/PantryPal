import apiClient from "./apiClient";

export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  ME: "/auth/me",
};

export const authService = {
  /**
   * Authenticate user with email and password
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @returns {Promise<Object>} Response containing user and accessToken
   */
  async login({ email, password }) {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Register a new user account
   * @param {Object} userData
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string} userData.password
   * @returns {Promise<Object>} Response containing user and accessToken
   */
  async register({ name, email, password }) {
    const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, {
      name,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Fetch currently authenticated user profile
   * @returns {Promise<Object>} Response containing user profile
   */
  async getCurrentUser() {
    const response = await apiClient.get(AUTH_ENDPOINTS.ME);
    return response.data;
  },

  /**
   * Clear local authentication credentials
   */
  logout() {
    localStorage.removeItem("pantrypal_token");
    localStorage.removeItem("pantrypal_user");
  },
};

export default authService;
