import api from './api';
import { AUTH } from '../constants/api';

/**
 * Get authenticated user profile
 * GET /api/v1/auth/me
 */
export const getUserProfile = async () => {
  const res = await api.get(AUTH.ME);
  return res.data?.data?.user || res.data?.data;
};

/**
 * Update authenticated user profile
 * PUT /api/v1/auth/profile
 */
export const updateUserProfile = async ({ name, email }) => {
  const res = await api.put(AUTH.PROFILE, { name, email });
  return res.data?.data?.user || res.data?.data;
};

/**
 * Securely change account password
 * POST /api/v1/auth/change-password
 */
export const changeUserPassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const res = await api.post(AUTH.CHANGE_PASSWORD, {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return res.data?.data || res.data;
};

/**
 * Delete account permanently with identity verification
 * DELETE /api/v1/auth/account
 */
export const deleteUserAccount = async ({ password }) => {
  const res = await api.delete(AUTH.DELETE_ACCOUNT, {
    data: { password },
  });
  return res.data?.data || res.data;
};

/**
 * Export complete server-persisted user archive
 * GET /api/v1/auth/export
 */
export const exportUserData = async () => {
  const res = await api.get(AUTH.EXPORT);
  return res.data?.data || res.data;
};
