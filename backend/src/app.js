import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import pantryItemRoutes from "./routes/pantryItemRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import recipeIngredientRoutes from "./routes/recipeIngredientRoutes.js";
import recipePantryMatchingRoutes from "./routes/recipePantryMatchingRoutes.js";
import recipeNutritionRoutes from "./routes/recipeNutritionRoutes.js";
import shoppingListRoutes from "./routes/shoppingListRoutes.js";
import mealPlanRoutes from "./routes/mealPlanRoutes.js";
import recipeFavoriteRoutes from "./routes/recipeFavoriteRoutes.js";
import pantryExpiryRoutes from "./routes/pantryExpiryRoutes.js";
import pantryLowStockRoutes from "./routes/pantryLowStockRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
    },
  });
});

app.use("/api/v1/auth", authRoutes);
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

app.use(errorHandler);

export default app;