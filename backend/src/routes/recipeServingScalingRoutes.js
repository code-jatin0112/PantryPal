import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  scaleRecipeServingsController,
} from "../controllers/recipeServingScalingController.js";

import {
  recipeServingScalingValidation,
} from "../validators/recipeServingScalingValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/scale",
  recipeServingScalingValidation,
  handleValidationErrors,
  scaleRecipeServingsController
);

export default router;
