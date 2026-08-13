import { body, param, query } from "express-validator";

const dietaryRequirementsValidation = (field) =>
  body(field)
    .optional()
    .isArray()
    .withMessage("Dietary requirements must be an array");

const otherPreferencesValidation = (field) =>
  body(field)
    .optional()
    .isArray()
    .withMessage("Other preferences must be an array");

export const mealPlanParamsValidation = [
  param("mealPlanId")
    .isUUID()
    .withMessage("Meal plan ID must be a valid UUID"),
];

export const mealPlanDishParamsValidation = [
  param("mealPlanId")
    .isUUID()
    .withMessage("Meal plan ID must be a valid UUID"),

  param("dishId")
    .isUUID()
    .withMessage("Dish ID must be a valid UUID"),
];

export const dishValidation = [
  body("dishes")
    .isArray({ min: 1 })
    .withMessage("At least one dish is required"),

  body("dishes.*.recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("dishes.*.plannedDate")
    .optional()
    .isISO8601()
    .withMessage("Planned date must be a valid ISO 8601 date"),

  body("dishes.*.mealType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Meal type cannot be empty")
    .isLength({ max: 30 })
    .withMessage("Meal type must not exceed 30 characters"),

  body("dishes.*.requestedServings")
    .isInt({ min: 1 })
    .withMessage("Requested servings must be a positive integer"),

  body("dishes.*.cuisine")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Cuisine must not exceed 50 characters"),

  body("dishes.*.recipePreference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Recipe preference must not exceed 100 characters"),

  dietaryRequirementsValidation(
    "dishes.*.dietaryRequirements"
  ),

  body("dishes.*.budgetPriority")
    .optional()
    .trim()
    .isIn(["low", "medium", "high"])
    .withMessage(
      "Budget priority must be low, medium, or high"
    ),

  otherPreferencesValidation(
    "dishes.*.otherPreferences"
  ),
];

const singleDishFields = [
  body("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("plannedDate")
    .optional()
    .isISO8601()
    .withMessage("Planned date must be a valid ISO 8601 date"),

  body("mealType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Meal type cannot be empty")
    .isLength({ max: 30 })
    .withMessage("Meal type must not exceed 30 characters"),

  body("requestedServings")
    .isInt({ min: 1 })
    .withMessage(
      "Requested servings must be a positive integer"
    ),

  body("cuisine")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Cuisine must not exceed 50 characters"),

  body("recipePreference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage(
      "Recipe preference must not exceed 100 characters"
    ),

  dietaryRequirementsValidation(
    "dietaryRequirements"
  ),

  body("budgetPriority")
    .optional()
    .trim()
    .isIn(["low", "medium", "high"])
    .withMessage(
      "Budget priority must be low, medium, or high"
    ),

  otherPreferencesValidation(
    "otherPreferences"
  ),
];

export const createMealPlanValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Meal plan name is required")
    .isLength({ max: 100 })
    .withMessage(
      "Meal plan name must not exceed 100 characters"
    ),

  body("startDate")
    .isISO8601()
    .withMessage(
      "Start date must be a valid ISO 8601 date"
    ),

  body("endDate")
    .isISO8601()
    .withMessage(
      "End date must be a valid ISO 8601 date"
    ),

  body("peopleCount")
    .isInt({ min: 1 })
    .withMessage(
      "People count must be a positive integer"
    ),

  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget must not be negative"),

  ...dishValidation,
];

export const updateMealPlanValidation = [
  mealPlanParamsValidation[0],

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Meal plan name cannot be empty"
    )
    .isLength({ max: 100 })
    .withMessage(
      "Meal plan name must not exceed 100 characters"
    ),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage(
      "Start date must be a valid ISO 8601 date"
    ),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage(
      "End date must be a valid ISO 8601 date"
    ),

  body("peopleCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "People count must be a positive integer"
    ),

  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget must not be negative"),
];

export const addMealPlanDishValidation = [
  mealPlanDishParamsValidation[0],
  ...singleDishFields,
];

export const updateMealPlanDishValidation = [
  ...mealPlanDishParamsValidation,

  body("recipeId")
    .optional()
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("plannedDate")
    .optional()
    .isISO8601()
    .withMessage(
      "Planned date must be a valid ISO 8601 date"
    ),

  body("mealType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Meal type cannot be empty")
    .isLength({ max: 30 })
    .withMessage(
      "Meal type must not exceed 30 characters"
    ),

  body("requestedServings")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Requested servings must be a positive integer"
    ),

  body("cuisine")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Cuisine must not exceed 50 characters"),

  body("recipePreference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage(
      "Recipe preference must not exceed 100 characters"
    ),

  body("dietaryRequirements")
    .optional()
    .isArray()
    .withMessage(
      "Dietary requirements must be an array"
    ),

  body("budgetPriority")
    .optional()
    .trim()
    .isIn(["low", "medium", "high"])
    .withMessage(
      "Budget priority must be low, medium, or high"
    ),

  body("otherPreferences")
    .optional()
    .isArray()
    .withMessage(
      "Other preferences must be an array"
    ),
];

export const mealPlanQueryValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage(
      "Start date must be a valid ISO 8601 date"
    ),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage(
      "End date must be a valid ISO 8601 date"
    ),
];
