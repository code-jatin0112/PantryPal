/**
 * ShoppingList Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE shopping_lists (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   name VARCHAR(100) NOT NULL DEFAULT 'Weekly Groceries',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * CREATE TABLE shopping_list_items (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
 *   recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
 *   name VARCHAR(100) NOT NULL,
 *   quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
 *   unit VARCHAR(30) NOT NULL,
 *   is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
 *   estimated_cost NUMERIC(10, 2) DEFAULT 0.00
 * );
 * CREATE INDEX idx_shopping_list_user ON shopping_lists(user_id);
 * CREATE INDEX idx_shopping_items_purchased ON shopping_list_items(shopping_list_id, is_purchased);
 */

import mongoose from "mongoose";

const shoppingListItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.01, "Quantity must be greater than 0"],
      default: 1,
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      lowercase: true,
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, "Estimated cost cannot be negative"],
    },
  },
  { _id: true }
);

const shoppingListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Shopping list must belong to a user"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Shopping list title is required"],
      default: "Weekly Groceries",
      trim: true,
    },
    items: {
      type: [shoppingListItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

shoppingListSchema.index({ userId: 1, "items.isPurchased": 1 });

// Virtuals
shoppingListSchema.virtual("totalItems").get(function () {
  return this.items ? this.items.length : 0;
});

shoppingListSchema.virtual("purchasedCount").get(function () {
  if (!this.items) return 0;
  return this.items.filter((i) => i.isPurchased).length;
});

shoppingListSchema.virtual("estimatedTotal").get(function () {
  if (!this.items) return 0;
  return this.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
});

export const ShoppingList =
  mongoose.models.ShoppingList ||
  mongoose.model("ShoppingList", shoppingListSchema);
export default ShoppingList;
