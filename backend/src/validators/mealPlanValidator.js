import { body, param, query } from "express-validator";

export const mealPlanParamsValidation = [
  param("mealPlanId")
    .isUUID()
    .withMessage("Meal plan ID must be a valid UUID"),
];

export const createMealPlanValidation = [
  body("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("date")
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("mealType")
    .trim()
    .notEmpty()
    .withMessage("Meal type is required")
    .isLength({ max: 30 })
    .withMessage("Meal type must not exceed 30 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

export const updateMealPlanValidation = [
  ...mealPlanParamsValidation,

  body("recipeId")
    .optional()
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("mealType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Meal type cannot be empty")
    .isLength({ max: 30 })
    .withMessage("Meal type must not exceed 30 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

export const mealPlanQueryValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),

  query("mealType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Meal type cannot be empty")
    .isLength({ max: 30 })
    .withMessage("Meal type must not exceed 30 characters"),
];