import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import pantryItemRoutes from "./routes/pantryItemRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import recipeRoutes from "./routes/recipeRoutes.js";

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

app.use(errorHandler);

export default app;