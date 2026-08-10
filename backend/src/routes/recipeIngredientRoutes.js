import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createRecipeIngredientController,
  getRecipeIngredientsController,
  getRecipeIngredientByIdController,
  updateRecipeIngredientController,
  deleteRecipeIngredientController,
} from "../controllers/recipeIngredientController.js";

import {
  recipeIdValidation,
  recipeIngredientParamsValidation,
  createRecipeIngredientValidation,
  updateRecipeIngredientValidation,
} from "../validators/recipeIngredientValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  recipeIdValidation,
  createRecipeIngredientValidation,
  handleValidationErrors,
  createRecipeIngredientController
);

router.get(
  "/",
  recipeIdValidation,
  handleValidationErrors,
  getRecipeIngredientsController
);

router.get(
  "/:ingredientId",
  recipeIngredientParamsValidation,
  handleValidationErrors,
  getRecipeIngredientByIdController
);

router.patch(
  "/:ingredientId",
  updateRecipeIngredientValidation,
  handleValidationErrors,
  updateRecipeIngredientController
);

router.delete(
  "/:ingredientId",
  recipeIngredientParamsValidation,
  handleValidationErrors,
  deleteRecipeIngredientController
);

export default router;