import mongoose from "mongoose";

const AiInteractionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    messagePrompt: {
      type: String,
      required: [true, "Message prompt is required"],
    },
    intentDetected: {
      type: String,
      required: [true, "Detected intent is required"],
      enum: ["RECIPE_GENERATION", "MEAL_PLANNING", "KITCHEN_ASSISTANT", "UNKNOWN"],
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed, // Stores flexible JSON objects or strings
      required: true,
    },
    tokenUsage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const AiInteractionLog = mongoose.model("AiInteractionLog", AiInteractionLogSchema);
