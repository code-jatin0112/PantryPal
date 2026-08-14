import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  generateAIRecommendationsController,
} from "../controllers/aiRecommendationController.js";

import {
  generateAIRecommendationsValidation,
} from "../validators/aiRecommendationValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/recommendations",
  generateAIRecommendationsValidation,
  handleValidationErrors,
  generateAIRecommendationsController
);

export default router;
