import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { getAiLimiter } from "../config/security.js";

import {
  generateAIRecommendationsController,
} from "../controllers/aiRecommendationController.js";

import {
  generateAIRecommendationsValidation,
} from "../validators/aiRecommendationValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();
const aiLimiter = getAiLimiter();

router.use(authenticate);

router.post(
  "/recommendations",
  aiLimiter,
  generateAIRecommendationsValidation,
  handleValidationErrors,
  generateAIRecommendationsController
);

export default router;
