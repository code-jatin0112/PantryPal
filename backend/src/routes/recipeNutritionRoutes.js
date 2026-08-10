import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createRecipeNutritionController,
  getRecipeNutritionController,
  updateRecipeNutritionController,
  deleteRecipeNutritionController,
} from "../controllers/recipeNutritionController.js";

import {
  createRecipeNutritionValidation,
  recipeNutritionValidation,
  updateRecipeNutritionValidation,
} from "../validators/recipeNutritionValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  createRecipeNutritionValidation,
  handleValidationErrors,
  createRecipeNutritionController
);

router.get(
  "/",
  recipeNutritionValidation,
  handleValidationErrors,
  getRecipeNutritionController
);

router.patch(
  "/",
  updateRecipeNutritionValidation,
  handleValidationErrors,
  updateRecipeNutritionController
);

router.delete(
  "/",
  recipeNutritionValidation,
  handleValidationErrors,
  deleteRecipeNutritionController
);

export default router;