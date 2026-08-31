/**
 * MealPlan Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE meal_plans (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   name VARCHAR(100) NOT NULL,
 *   start_date DATE NOT NULL,
 *   end_date DATE NOT NULL,
 *   people_count INTEGER NOT NULL DEFAULT 2 CHECK (people_count > 0),
 *   budget NUMERIC(10, 2),
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   CONSTRAINT chk_meal_plan_dates CHECK (end_date >= start_date)
 * );
 * CREATE TABLE meal_plan_items (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
 *   recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
 *   planned_date DATE NOT NULL,
 *   meal_type VARCHAR(30) DEFAULT 'dinner',
 *   requested_servings INTEGER NOT NULL DEFAULT 2
 * );
 * CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
 * CREATE INDEX idx_meal_plans_dates ON meal_plans(user_id, start_date, end_date);
 */

import mongoose from "mongoose";

const mealPlanDishSchema = new mongoose.Schema(
  {
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: [true, "Dish must reference a recipe"],
    },
    plannedDate: {
      type: Date,
      required: [true, "Planned date is required"],
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack", "other"],
      default: "dinner",
    },
    requestedServings: {
      type: Number,
      required: [true, "Requested servings is required"],
      min: [1, "Requested servings must be at least 1"],
      default: 2,
    },
    cuisine: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Meal plan must belong to a user"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Meal plan name is required"],
      trim: true,
      maxlength: [100, "Meal plan name cannot exceed 100 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      index: true,
    },
    peopleCount: {
      type: Number,
      required: [true, "People count is required"],
      min: [1, "People count must be at least 1"],
      default: 2,
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },
    meals: {
      type: [mealPlanDishSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Date validation hook
mealPlanSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot precede start date");
  }
  next();
});

// Composite index
mealPlanSchema.index({ userId: 1, startDate: 1, endDate: 1 });

// Virtuals
mealPlanSchema.virtual("totalMeals").get(function () {
  return this.meals ? this.meals.length : 0;
});

export const MealPlan =
  mongoose.models.MealPlan || mongoose.model("MealPlan", mealPlanSchema);
export default MealPlan;
