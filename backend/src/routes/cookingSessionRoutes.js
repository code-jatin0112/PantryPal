import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  startSession,
  getSession,
  updateProgress,
} from "../controllers/cookingSessionController.js";

import {
  completeSession,
} from "../controllers/cookingSessionCompletionController.js";

import {
  startCookingSessionValidation,
  cookingSessionIdValidation,
  updateCookingProgressValidation,
} from "../validators/cookingSessionValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

import {
  completeCookingSessionValidation,
} from "../validators/cookingSessionCompletionValidator.js";

const router = express.Router();

router.post(
  "/recipes/:recipeId/cooking-sessions",
  authenticate,
  startCookingSessionValidation,
  handleValidationErrors,
  startSession
);

router.get(
  "/cooking-sessions/:sessionId",
  authenticate,
  cookingSessionIdValidation,
  handleValidationErrors,
  getSession
);

router.patch(
  "/cooking-sessions/:sessionId/progress",
  authenticate,
  updateCookingProgressValidation,
  handleValidationErrors,
  updateProgress
);

router.post(
  "/cooking-sessions/:sessionId/complete",
  authenticate,
  completeCookingSessionValidation,
  handleValidationErrors,
  completeSession
);

export default router;