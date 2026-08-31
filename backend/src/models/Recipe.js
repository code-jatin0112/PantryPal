/**
 * Recipe Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE recipes (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 *   title VARCHAR(200) NOT NULL,
 *   description TEXT,
 *   prep_time INTEGER NOT NULL DEFAULT 0,
 *   cook_time INTEGER NOT NULL DEFAULT 0,
 *   servings INTEGER NOT NULL DEFAULT 2 CHECK (servings > 0),
 *   difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
 *   cuisine VARCHAR(50) DEFAULT 'General',
 *   instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
 *   nutrition JSONB DEFAULT '{}'::jsonb,
 *   is_public BOOLEAN DEFAULT TRUE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * CREATE TABLE recipe_ingredients (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
 *   name VARCHAR(100) NOT NULL,
 *   quantity NUMERIC(10, 2) NOT NULL,
 *   unit VARCHAR(30) NOT NULL
 * );
 * CREATE INDEX idx_recipes_title ON recipes(title);
 * CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
 */

import mongoose from "mongoose";

const recipeIngredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      lowercase: true,
    },
    optional: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const recipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Recipe title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    prepTime: {
      type: Number,
      default: 15,
      min: [0, "Preparation time cannot be negative"],
    },
    cookTime: {
      type: Number,
      default: 20,
      min: [0, "Cooking time cannot be negative"],
    },
    servings: {
      type: Number,
      required: [true, "Base servings count is required"],
      default: 2,
      min: [1, "Servings must be at least 1"],
    },
    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "{VALUE} is not a valid difficulty level",
      },
      default: "medium",
      index: true,
    },
    cuisine: {
      type: String,
      trim: true,
      default: "General",
      index: true,
    },
    ingredients: {
      type: [recipeIngredientSchema],
      validate: [
        (val) => val.length > 0,
        "A recipe must have at least one ingredient",
      ],
    },
    instructions: {
      type: [String],
      validate: [
        (val) => val.length > 0,
        "A recipe must have at least one instruction step",
      ],
    },
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbohydrates: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full text search index
recipeSchema.index({
  title: "text",
  description: "text",
  cuisine: "text",
  "ingredients.name": "text",
});

// Virtual for total time
recipeSchema.virtual("totalTime").get(function () {
  return (this.prepTime || 0) + (this.cookTime || 0);
});

// Virtual for ratings relation
recipeSchema.virtual("ratings", {
  ref: "RecipeRating",
  localField: "_id",
  foreignField: "recipeId",
});

export const Recipe =
  mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);
export default Recipe;

