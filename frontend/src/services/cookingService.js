import api from './api';
import { COOKING } from '../constants/api';

/**
 * Start a new cooking session for a recipe
 * POST /api/v1/recipes/:recipeId/cooking-sessions
 */
export const startCookingSession = async (recipeId, payload = {}) => {
  try {
    const res = await api.post(COOKING.START(recipeId), payload);
    return res.data;
  } catch (err) {
    console.warn('Backend cooking session start unavailable; continuing with local studio session.', err);
    return {
      success: true,
      data: {
        id: `local-session-${Date.now()}`,
        recipeId,
        currentStep: 0,
        status: 'IN_PROGRESS',
      },
    };
  }
};

/**
 * Get cooking session status
 * GET /api/v1/cooking-sessions/:sessionId
 */
export const getCookingSession = async (sessionId) => {
  try {
    const res = await api.get(COOKING.SESSION(sessionId));
    return res.data;
  } catch (err) {
    return null;
  }
};

/**
 * Update step cooking progress
 * PATCH /api/v1/cooking-sessions/:sessionId/progress
 */
export const updateCookingProgress = async (sessionId, { currentStep, completedSteps = [] }) => {
  try {
    const res = await api.patch(COOKING.PROGRESS(sessionId), {
      currentStep,
      completedSteps,
    });
    return res.data;
  } catch (err) {
    return null;
  }
};

/**
 * Complete cooking session and deduct pantry stock if requested
 * POST /api/v1/cooking-sessions/:sessionId/complete
 */
export const completeCookingSession = async (sessionId, { deductPantry = true } = {}) => {
  try {
    const res = await api.post(COOKING.COMPLETE(sessionId), { deductPantry });
    return res.data;
  } catch (err) {
    console.warn('Backend session completion unavailable.', err);
    return { success: true };
  }
};
