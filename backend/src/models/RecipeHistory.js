/**
 * RecipeHistory Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE recipe_history (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
 *   cooked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   servings_cooked INTEGER DEFAULT 2 CHECK (servings_cooked > 0),
 *   duration_minutes INTEGER,
 *   notes TEXT,
 *   waste_prevented_grams NUMERIC(10, 2) DEFAULT 0.00
 * );
 * CREATE INDEX idx_recipe_history_user_cooked ON recipe_history(user_id, cooked_at DESC);
 */

import mongoose from "mongoose";

const recipeHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "History record must reference a user"],
      index: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: [true, "History record must reference a recipe"],
      index: true,
    },
    cookedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    servingsCooked: {
      type: Number,
      default: 2,
      min: [1, "Servings cooked must be at least 1"],
    },
    durationMinutes: {
      type: Number,
      min: [0, "Duration cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    wastePreventedGrams: {
      type: Number,
      default: 0,
      min: [0, "Waste prevented cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

recipeHistorySchema.index({ userId: 1, cookedAt: -1 });

export const RecipeHistory =
  mongoose.models.RecipeHistory ||
  mongoose.model("RecipeHistory", recipeHistorySchema);
export default RecipeHistory;

