import express from "express";
import {
  helmetConfig,
  getCorsOptions,
  getRateLimiter,
} from "./config/security.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import pantryItemRoutes from "./routes/pantryItemRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import recipeIngredientRoutes from "./routes/recipeIngredientRoutes.js";
import recipePantryMatchingRoutes from "./routes/recipePantryMatchingRoutes.js";
import recipeNutritionRoutes from "./routes/recipeNutritionRoutes.js";
import shoppingListRoutes from "./routes/shoppingListRoutes.js";
import mealPlanRoutes from "./routes/mealPlanRoutes.js";
import recipeFavoriteRoutes from "./routes/recipeFavoriteRoutes.js";
import pantryExpiryRoutes from "./routes/pantryExpiryRoutes.js";
import pantryLowStockRoutes from "./routes/pantryLowStockRoutes.js";
import cookingSessionRoutes from "./routes/cookingSessionRoutes.js";
import aiRecipeRoutes from "./routes/aiRecipeRoutes.js";
import aiRecommendationRoutes from "./routes/aiRecommendationRoutes.js";
import recipeServingScalingRoutes from "./routes/recipeServingScalingRoutes.js";
import userPreferenceRoutes from "./routes/userPreferenceRoutes.js";
import aiChatRoutes from "./routes/aiChatRoutes.js";

const app = express();

if (
  process.env.TRUST_PROXY === "true" ||
  process.env.NODE_ENV === "production"
) {
  app.set("trust proxy", 1);
}

// Security Middleware Ordering
app.use(helmetConfig);
app.use(getCorsOptions());
app.use(getRateLimiter());
app.use(express.json({ limit: "1mb" }));

// Health Check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
    },
  });
});

// Application Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/preferences", userPreferenceRoutes);
app.use("/api/v1/pantries", pantryRoutes);
app.use("/api/v1/pantries/:pantryId/items", pantryItemRoutes);
app.use("/api/v1/recipes", recipeRoutes);
app.use(
  "/api/v1/recipes/:recipeId/ingredients",
  recipeIngredientRoutes
);
app.use(
  "/api/v1/recipes/:recipeId/pantries/:pantryId",
  recipePantryMatchingRoutes
);
app.use(
  "/api/v1/recipes/:recipeId/nutrition",
  recipeNutritionRoutes
);
app.use("/api/v1/shopping-list", shoppingListRoutes);
app.use("/api/v1/meal-plans", mealPlanRoutes);
app.use("/api/v1/recipes", recipeFavoriteRoutes);
app.use("/api/v1/pantries", pantryExpiryRoutes);
app.use("/api/v1/pantries", pantryLowStockRoutes);
app.use("/api/v1", cookingSessionRoutes);
app.use("/api/v1/ai", aiRecipeRoutes);
app.use("/api/v1/ai", aiRecommendationRoutes);
app.use("/api/v1/ai", aiChatRoutes);
app.use(
  "/api/v1/recipes/:recipeId",
  recipeServingScalingRoutes
);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;