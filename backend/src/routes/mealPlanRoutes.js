import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createMealPlanController,
  getMealPlansController,
  getMealPlanByIdController,
  updateMealPlanController,
  deleteMealPlanController,
} from "../controllers/mealPlanController.js";

import {
  mealPlanParamsValidation,
  createMealPlanValidation,
  updateMealPlanValidation,
  mealPlanQueryValidation,
} from "../validators/mealPlanValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  createMealPlanValidation,
  handleValidationErrors,
  createMealPlanController
);

router.get(
  "/",
  mealPlanQueryValidation,
  handleValidationErrors,
  getMealPlansController
);

router.get(
  "/:mealPlanId",
  mealPlanParamsValidation,
  handleValidationErrors,
  getMealPlanByIdController
);

router.patch(
  "/:mealPlanId",
  updateMealPlanValidation,
  handleValidationErrors,
  updateMealPlanController
);

router.delete(
  "/:mealPlanId",
  mealPlanParamsValidation,
  handleValidationErrors,
  deleteMealPlanController
);

export default router;