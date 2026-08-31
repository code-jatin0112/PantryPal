/**
 * PantryItem Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE pantry_items (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   name VARCHAR(100) NOT NULL,
 *   quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0),
 *   unit VARCHAR(30) NOT NULL,
 *   category VARCHAR(50) DEFAULT 'pantry' CHECK (category IN ('produce', 'dairy', 'meat', 'pantry', 'spices', 'bakery', 'frozen', 'beverages', 'other')),
 *   expiry_date TIMESTAMP WITH TIME ZONE,
 *   low_stock_threshold NUMERIC(10, 2) DEFAULT 1.0,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
 * CREATE INDEX idx_pantry_items_expiry ON pantry_items(user_id, expiry_date);
 * CREATE INDEX idx_pantry_items_category ON pantry_items(user_id, category);
 */

import mongoose from "mongoose";

const pantryItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Pantry item must belong to a user"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [100, "Item name cannot exceed 100 characters"],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 1,
    },
    unit: {
      type: String,
      required: [true, "Measurement unit is required"],
      trim: true,
      maxlength: [30, "Unit cannot exceed 30 characters"],
      lowercase: true,
    },
    category: {
      type: String,
      enum: {
        values: [
          "produce",
          "dairy",
          "meat",
          "pantry",
          "spices",
          "bakery",
          "frozen",
          "beverages",
          "other",
        ],
        message: "{VALUE} is not a valid category",
      },
      default: "pantry",
      index: true,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 1,
      min: [0, "Low stock threshold cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Composite indexes for rapid filtering
pantryItemSchema.index({ userId: 1, expiryDate: 1 });
pantryItemSchema.index({ userId: 1, category: 1 });
pantryItemSchema.index({ userId: 1, name: "text" });

// Virtual for calculating days remaining until expiration
pantryItemSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diffTime = this.expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for expired status
pantryItemSchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for low stock status
pantryItemSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});

export const PantryItem =
  mongoose.models.PantryItem || mongoose.model("PantryItem", pantryItemSchema);
export default PantryItem;

