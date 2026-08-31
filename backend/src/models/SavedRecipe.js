/**
 * SavedRecipe Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE saved_recipes (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
 *   notes TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   UNIQUE(user_id, recipe_id)
 * );
 * CREATE INDEX idx_saved_recipes_user ON saved_recipes(user_id);
 * CREATE INDEX idx_saved_recipes_recipe ON saved_recipes(recipe_id);
 */

import mongoose from "mongoose";

const savedRecipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Saved recipe must reference a user"],
      index: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: [true, "Saved recipe must reference a recipe"],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Enforce unique save per user per recipe
savedRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const SavedRecipe =
  mongoose.models.SavedRecipe ||
  mongoose.model("SavedRecipe", savedRecipeSchema);
export default SavedRecipe;

