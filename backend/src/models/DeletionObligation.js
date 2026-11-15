import mongoose from "mongoose";

const DeletionObligationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    targetCollection: {
      type: String,
      enum: ["UnstructuredRecipe", "AiInteractionLog", "ALL"],
      default: "ALL",
    },
    documentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "FAILED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const DeletionObligation =
  mongoose.models.DeletionObligation ||
  mongoose.model("DeletionObligation", DeletionObligationSchema);
