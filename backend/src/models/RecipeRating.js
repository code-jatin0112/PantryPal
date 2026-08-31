/**
 * RecipeRating Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE recipe_ratings (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
 *   rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
 *   review TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   UNIQUE(user_id, recipe_id)
 * );
 * CREATE INDEX idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
 */

import mongoose from "mongoose";

const recipeRatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Rating must reference a user"],
      index: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: [true, "Rating must reference a recipe"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating value is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },
    review: {
      type: String,
      trim: true,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One rating per user per recipe
recipeRatingSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

// Static method to recalculate recipe average rating
recipeRatingSchema.statics.calcAverageRating = async function (recipeId) {
  const stats = await this.aggregate([
    { $match: { recipeId: new mongoose.Types.ObjectId(recipeId) } },
    {
      $group: {
        _id: "$recipeId",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const Recipe = mongoose.model("Recipe");
  if (stats.length > 0) {
    await Recipe.findByIdAndUpdate(recipeId, {
      ratingCount: stats[0].nRating,
      ratingAverage: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await Recipe.findByIdAndUpdate(recipeId, {
      ratingCount: 0,
      ratingAverage: 0,
    });
  }
};

// Hooks to update recipe statistics automatically
recipeRatingSchema.post("save", function () {
  this.constructor.calcAverageRating(this.recipeId);
});

export const RecipeRating =
  mongoose.models.RecipeRating ||
  mongoose.model("RecipeRating", recipeRatingSchema);
export default RecipeRating;
