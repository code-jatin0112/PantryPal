import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  startSession,
  getSession,
  updateProgress,
} from "../controllers/cookingSessionController.js";

import {
  startCookingSessionValidation,
  cookingSessionIdValidation,
  updateCookingProgressValidation,
} from "../validators/cookingSessionValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/recipes/:recipeId/cooking-sessions",
  startCookingSessionValidation,
  handleValidationErrors,
  startSession
);

router.get(
  "/cooking-sessions/:sessionId",
  cookingSessionIdValidation,
  handleValidationErrors,
  getSession
);

router.patch(
  "/cooking-sessions/:sessionId/progress",
  updateCookingProgressValidation,
  handleValidationErrors,
  updateProgress
);

export default router;