/**
 * AIRequestLog Entity Model
 *
 * SQL Equivalent Schema:
 * CREATE TABLE ai_request_logs (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 *   feature VARCHAR(50) NOT NULL CHECK (feature IN ('recommendation', 'chat', 'recipe_generation', 'inventory_analysis')),
 *   prompt TEXT NOT NULL,
 *   response JSONB NOT NULL,
 *   model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
 *   prompt_tokens INTEGER DEFAULT 0,
 *   completion_tokens INTEGER DEFAULT 0,
 *   total_tokens INTEGER DEFAULT 0,
 *   response_time_ms INTEGER NOT NULL,
 *   rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
 *   feedback TEXT,
 *   is_regenerated BOOLEAN DEFAULT FALSE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * CREATE INDEX idx_ai_logs_user_feature ON ai_request_logs(user_id, feature, created_at DESC);
 */

import mongoose from "mongoose";

const aiRequestLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    feature: {
      type: String,
      enum: [
        "recommendation",
        "chat",
        "recipe_generation",
        "inventory_analysis",
      ],
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: [true, "Prompt text is required"],
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "AI Response payload is required"],
    },
    model: {
      type: String,
      default: "gemini-2.5-flash",
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    responseTimeMs: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
    },
    isRegenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

aiRequestLogSchema.index({ userId: 1, feature: 1, createdAt: -1 });

export const AIRequestLog =
  mongoose.models.AIRequestLog ||
  mongoose.model("AIRequestLog", aiRequestLogSchema);
export default AIRequestLog;

