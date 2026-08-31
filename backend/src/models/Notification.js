/**
 * Notification Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE notifications (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   title VARCHAR(150) NOT NULL,
 *   message TEXT NOT NULL,
 *   type VARCHAR(50) NOT NULL CHECK (type IN ('expiry_reminder', 'meal_reminder', 'shopping_reminder', 'recipe_recommendation', 'system')),
 *   is_read BOOLEAN NOT NULL DEFAULT FALSE,
 *   read_at TIMESTAMP WITH TIME ZONE,
 *   metadata JSONB DEFAULT '{}'::jsonb,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
 */

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must belong to a user"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          "expiry_reminder",
          "meal_reminder",
          "shopping_reminder",
          "recipe_recommendation",
          "system",
        ],
        message: "{VALUE} is not a valid notification type",
      },
      required: true,
      default: "system",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export default Notification;

