import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  addRecipeFavoriteController,
  getFavoriteRecipesController,
  removeRecipeFavoriteController,
  isRecipeFavoritedController,
} from "../controllers/recipeFavoriteController.js";

import {
  recipeFavoriteParamsValidation,
} from "../validators/recipeFavoriteValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/favorites",
  getFavoriteRecipesController
);

router.post(
  "/:recipeId/favorite",
  recipeFavoriteParamsValidation,
  handleValidationErrors,
  addRecipeFavoriteController
);

router.get(
  "/:recipeId/favorite/status",
  recipeFavoriteParamsValidation,
  handleValidationErrors,
  isRecipeFavoritedController
);

router.delete(
  "/:recipeId/favorite",
  recipeFavoriteParamsValidation,
  handleValidationErrors,
  removeRecipeFavoriteController
);

export default router;