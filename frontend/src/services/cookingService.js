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

// Per-session progress update queue to guarantee serialized in-order execution
const sessionProgressQueues = new Map();

/**
 * Clear any in-flight / queued progress updates for a session (e.g. on completion)
 */
export const clearSessionProgressQueue = (sessionId) => {
  if (sessionId && sessionProgressQueues.has(sessionId)) {
    sessionProgressQueues.delete(sessionId);
  }
};

/**
 * Update step cooking progress (1-based currentStep)
 * Serialized per session to ensure in-order execution and prevent out-of-order commits on PostgreSQL.
 * If a request is already in-flight for this session, subsequent calls update the pending target
 * so that only the latest intended step is sent once the in-flight request settles.
 * PATCH /api/v1/cooking-sessions/:sessionId/progress
 */
export const updateCookingProgress = async (sessionId, { currentStep, completedSteps } = {}) => {
  const step = Math.max(1, parseInt(currentStep, 10) || 1);

  if (!sessionProgressQueues.has(sessionId)) {
    sessionProgressQueues.set(sessionId, {
      inFlight: false,
      pending: null,
    });
  }

  const queue = sessionProgressQueues.get(sessionId);

  return new Promise((resolve, reject) => {
    // If a request is currently active, queue this as the latest pending request
    if (queue.inFlight) {
      if (queue.pending) {
        const prevPending = queue.pending;
        queue.pending = {
          payload: { currentStep: step, completedSteps },
          resolve: (val) => {
            prevPending.resolve(val);
            resolve(val);
          },
          reject: (err) => {
            prevPending.reject(err);
            reject(err);
          },
        };
      } else {
        queue.pending = {
          payload: { currentStep: step, completedSteps },
          resolve,
          reject,
        };
      }
      return;
    }

    const execute = async (payload, resFn, rejFn) => {
      queue.inFlight = true;
      try {
        const res = await api.patch(COOKING.PROGRESS(sessionId), {
          currentStep: payload.currentStep,
        });
        resFn(res.data);
      } catch (err) {
        rejFn(err);
      } finally {
        queue.inFlight = false;
        if (queue.pending) {
          const next = queue.pending;
          queue.pending = null;
          execute(next.payload, next.resolve, next.reject);
        } else {
          sessionProgressQueues.delete(sessionId);
        }
      }
    };

    execute({ currentStep: step, completedSteps }, resolve, reject);
  });
};

/**
 * Complete cooking session and deduct pantry inventory
 * POST /api/v1/cooking-sessions/:sessionId/complete
 */
export const completeCookingSession = async (sessionId, { pantryId } = {}) => {
  clearSessionProgressQueue(sessionId);
  const res = await api.post(COOKING.COMPLETE(sessionId), { pantryId });
  return res.data;
};
