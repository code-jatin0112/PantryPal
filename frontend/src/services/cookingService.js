import api from './api';
import { COOKING } from '../constants/api';

/**
 * Start a new cooking session for a recipe
 * POST /api/v1/recipes/:recipeId/cooking-sessions
 */
export const startCookingSession = async (recipeId, payload = {}) => {
  const servings = payload.servings ? Number(payload.servings) : 4;
  const res = await api.post(COOKING.START(recipeId), { servings });
  return res.data;
};

/**
 * Fetch active cooking session for a recipe if one exists
 * GET /api/v1/recipes/:recipeId/cooking-sessions/active
 */
export const getActiveCookingSession = async (recipeId) => {
  try {
    const res = await api.get(COOKING.ACTIVE(recipeId));
    return res.data;
  } catch (err) {
    // 404 specifically indicates that no active cooking session currently exists
    if (err.response?.status === 404) {
      return null;
    }
    // Re-throw authentication, authorization, server, or network errors
    throw err;
  }
};

/**
 * Get cooking session status by session ID
 * GET /api/v1/cooking-sessions/:sessionId
 */
export const getCookingSession = async (sessionId) => {
  const res = await api.get(COOKING.SESSION(sessionId));
  return res.data;
};

/**
 * Update step cooking progress (1-based currentStep)
 * PATCH /api/v1/cooking-sessions/:sessionId/progress
 */
export const updateCookingProgress = async (sessionId, { currentStep }) => {
  const step = Math.max(1, parseInt(currentStep, 10) || 1);
  const res = await api.patch(COOKING.PROGRESS(sessionId), {
    currentStep: step,
  });
  return res.data;
};

/**
 * Complete cooking session and deduct pantry inventory
 * POST /api/v1/cooking-sessions/:sessionId/complete
 */
export const completeCookingSession = async (sessionId, { pantryId } = {}) => {
  const res = await api.post(COOKING.COMPLETE(sessionId), { pantryId });
  return res.data;
};
