import mongoose from "mongoose";

const UnstructuredRecipeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    sourcePrompt: {
      type: String,
    },
    rawOutput: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Raw output is required"],
    },
    conversionStatus: {
      type: String,
      enum: ["PENDING", "NORMALIZED", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const UnstructuredRecipe = mongoose.model("UnstructuredRecipe", UnstructuredRecipeSchema);
