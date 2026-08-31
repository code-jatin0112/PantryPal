import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  handleSaveRecipe,
  handleUnsaveRecipe,
  handleGetSavedRecipes,
  handleRateRecipe,
  handleAddHistory,
  handleGetHistory,
} from "../controllers/recipeInteractionController.js";

const router = express.Router();

router.use(authenticate);

// Saved recipes
router.get("/saved", handleGetSavedRecipes);
router.post("/saved", handleSaveRecipe);
router.post("/:id/save", handleSaveRecipe);
router.delete("/:id/save", handleUnsaveRecipe);

// Ratings
router.post("/:id/ratings", handleRateRecipe);

// History
router.get("/history", handleGetHistory);
router.post("/:id/history", handleAddHistory);

export default router;

