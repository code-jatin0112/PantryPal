import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import {
  createRecipeController,
  getRecipesController,
  getRecipeByIdController,
  updateRecipeController,
  deleteRecipeController,
} from "../controllers/recipeController.js";

import {
  recipeIdValidation,
  createRecipeValidation,
  updateRecipeValidation,
} from "../validators/recipeValidator.js";

import {
  consumeRecipe,
} from "../controllers/recipePantryConsumptionController.js";

import {
  consumeRecipeValidation,
} from "../validators/recipePantryConsumptionValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  createRecipeValidation,
  handleValidationErrors,
  createRecipeController
);

router.get("/", getRecipesController);

router.post(
  "/:recipeId/consume",
  consumeRecipeValidation,
  handleValidationErrors,
  consumeRecipe
);

router.get(
  "/:recipeId",
  recipeIdValidation,
  handleValidationErrors,
  getRecipeByIdController
);

router.patch(
  "/:recipeId",
  updateRecipeValidation,
  handleValidationErrors,
  updateRecipeController
);

router.delete(
  "/:recipeId",
  recipeIdValidation,
  handleValidationErrors,
  deleteRecipeController
);

export default router;