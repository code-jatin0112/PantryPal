import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  generateAIRecipeController,
} from "../controllers/aiRecipeController.js";

import {
  generateAIRecipeValidation,
} from "../validators/aiRecipeValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/recipes/generate",
  generateAIRecipeValidation,
  handleValidationErrors,
  generateAIRecipeController
);

export default router;