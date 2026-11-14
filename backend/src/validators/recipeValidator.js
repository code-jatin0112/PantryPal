import { body, param } from "express-validator";

export const recipeIdValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),
];

export const createRecipeValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Recipe title is required")
    .isLength({ max: 100 })
    .withMessage("Recipe title must not exceed 100 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("instructions")
    .trim()
    .notEmpty()
    .withMessage("Recipe instructions are required"),

  body("prepTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Preparation time must be a non-negative integer"),

  body("cookTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Cooking time must be a non-negative integer"),

  body("servings")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Servings must be at least 1"),

  body("ingredients")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Ingredients must be an array"),

  body("ingredients.*.id")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Ingredient ID must be a valid UUID"),

  body("ingredients.*.name")
    .trim()
    .notEmpty()
    .withMessage("Ingredient name is required")
    .isLength({ max: 100 })
    .withMessage("Ingredient name must not exceed 100 characters"),

  body("ingredients.*.quantity")
    .exists({ checkNull: true })
    .withMessage("Quantity is required")
    .isFloat({ gt: 0 })
    .withMessage("Quantity must be greater than 0"),

  body("ingredients.*.unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .isLength({ max: 30 })
    .withMessage("Unit must not exceed 30 characters"),

  body("nutrition")
    .optional({ nullable: true })
    .isObject()
    .withMessage("Nutrition must be an object"),

  body("nutrition.calories")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Calories must be 0 or greater"),

  body("nutrition.protein")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Protein must be 0 or greater"),

  body("nutrition.carbohydrates")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Carbohydrates must be 0 or greater"),

  body("nutrition.fat")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fat must be 0 or greater"),

  body("nutrition.fiber")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fiber must be 0 or greater"),

  body("nutrition.sugar")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sugar must be 0 or greater"),
];

export const updateRecipeValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Recipe title cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Recipe title must not exceed 100 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("instructions")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Recipe instructions cannot be empty"),

  body("prepTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Preparation time must be a non-negative integer"),

  body("cookTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Cooking time must be a non-negative integer"),

  body("servings")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Servings must be at least 1"),

  body("ingredients")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Ingredients must be an array"),

  body("ingredients.*.id")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Ingredient ID must be a valid UUID"),

  body("ingredients.*.name")
    .trim()
    .notEmpty()
    .withMessage("Ingredient name is required")
    .isLength({ max: 100 })
    .withMessage("Ingredient name must not exceed 100 characters"),

  body("ingredients.*.quantity")
    .exists({ checkNull: true })
    .withMessage("Quantity is required")
    .isFloat({ gt: 0 })
    .withMessage("Quantity must be greater than 0"),

  body("ingredients.*.unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .isLength({ max: 30 })
    .withMessage("Unit must not exceed 30 characters"),

  body("nutrition")
    .optional({ nullable: true })
    .isObject()
    .withMessage("Nutrition must be an object"),

  body("nutrition.calories")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Calories must be 0 or greater"),

  body("nutrition.protein")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Protein must be 0 or greater"),

  body("nutrition.carbohydrates")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Carbohydrates must be 0 or greater"),

  body("nutrition.fat")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fat must be 0 or greater"),

  body("nutrition.fiber")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fiber must be 0 or greater"),

  body("nutrition.sugar")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sugar must be 0 or greater"),
];
