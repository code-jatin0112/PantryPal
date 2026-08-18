import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createMealPlanController,
  getMealPlansController,
  getMealPlanByIdController,
  updateMealPlanController,
  addMealPlanDishController,
  updateMealPlanDishController,
  deleteMealPlanDishController,
  deleteMealPlanController,
  evaluateMealPlanController,
  getMealPlanGroceryRequirementsController,
} from "../controllers/mealPlanController.js";

import {
  mealPlanParamsValidation,
  createMealPlanValidation,
  updateMealPlanValidation,
  mealPlanQueryValidation,
  mealPlanDishParamsValidation,
  addMealPlanDishValidation,
  updateMealPlanDishValidation,
  evaluateMealPlanValidation,
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

router.post(
  "/:mealPlanId/evaluate",
  evaluateMealPlanValidation,
  handleValidationErrors,
  evaluateMealPlanController
);

router.post(
  "/:mealPlanId/grocery-requirements",
  evaluateMealPlanValidation,
  handleValidationErrors,
  getMealPlanGroceryRequirementsController
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

router.post(
  "/:mealPlanId/dishes",
  addMealPlanDishValidation,
  handleValidationErrors,
  addMealPlanDishController
);

router.patch(
  "/:mealPlanId/dishes/:dishId",
  mealPlanDishParamsValidation,
  updateMealPlanDishValidation,
  handleValidationErrors,
  updateMealPlanDishController
);

router.delete(
  "/:mealPlanId/dishes/:dishId",
  mealPlanDishParamsValidation,
  handleValidationErrors,
  deleteMealPlanDishController
);

router.delete(
  "/:mealPlanId",
  mealPlanParamsValidation,
  handleValidationErrors,
  deleteMealPlanController
);

export default router;
