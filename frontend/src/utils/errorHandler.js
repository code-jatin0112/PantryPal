/**
 * Centralized API error handler.
 * Extracts a user-friendly message from Axios error responses.
 */

const STATUS_MESSAGES = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. This resource may already exist.',
  422: 'The data you submitted could not be processed.',
  429: 'Too many requests. Please slow down and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'Server is temporarily unavailable. Please try again.',
  503: 'Service is under maintenance. Please check back soon.',
};

/**
 * Extract user-friendly error message from an Axios error.
 * @param {Error} error — Axios error object
 * @param {string} fallback — default message if none extracted
 * @returns {string}
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;

  // Network error (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Check your connection and try again.';
    }
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  const { status, data } = error.response;

  // Try backend-specific error message first
  const backendMsg =
    data?.error?.details?.[0]?.message ||
    data?.error?.message ||
    data?.message;

  if (backendMsg) return backendMsg;

  // Fall back to status-code message
  return STATUS_MESSAGES[status] || fallback;
};

/**
 * Returns the HTTP status code from an Axios error.
 * @param {Error} error
 * @returns {number | null}
 */
export const getErrorStatus = (error) => {
  return error?.response?.status ?? null;
};

/**
 * Returns true if the error is a network/timeout error (no HTTP response).
 * @param {Error} error
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error?.response;
};

/**
 * Returns true if the error is an auth error (401 or 403).
 * @param {Error} error
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  const status = getErrorStatus(error);
  return status === 401 || status === 403;
};
