import api from './api';
import { PREFERENCES, AUTH } from '../constants/api';

/**
 * Get user culinary & system preferences
 * GET /api/v1/preferences
 */
export const getUserPreferences = async () => {
  try {
    const res = await api.get(PREFERENCES.GET);
    return res.data?.data?.preferences || res.data?.data || null;
  } catch (err) {
    console.warn('Backend preferences endpoint unavailable; falling back to local storage preferences.', err);
    try {
      const saved = localStorage.getItem('pantrypal_user_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
};

/**
 * Update user preferences
 * PUT /api/v1/preferences
 */
export const updateUserPreferences = async (preferencesData) => {
  try {
    const res = await api.put(PREFERENCES.UPDATE, preferencesData);
    return res.data?.data?.preferences || res.data?.data || preferencesData;
  } catch (err) {
    console.warn('Backend preferences update unavailable; saving locally.', err);
    try {
      localStorage.setItem('pantrypal_user_settings', JSON.stringify(preferencesData));
    } catch {}
    return preferencesData;
  }
};

/**
 * Get authenticated user profile
 * GET /api/v1/auth/me
 */
export const getCurrentUserProfile = async () => {
  const res = await api.get(AUTH.ME);
  return res.data?.data?.user || res.data?.data;
};
