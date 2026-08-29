import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import * as aiService from "../../src/services/aiService.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const createTestAuthToken = (userId = "user-uuid-1234") => {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("AI Recommendations (FR-17) Integration Tests", () => {
  const userId = "user-uuid-1234";
  const pantryId = "11111111-1111-4111-8111-111111111111";
  const mealPlanId = "22222222-2222-4222-8222-222222222222";
  const token = createTestAuthToken(userId);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Authentication & Parameter Validation", () => {
    it("fails with 401 when no auth token is provided", async () => {
      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .send({ pantryId });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("fails with 400 when pantryId is not a valid UUID", async () => {
      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId: "invalid-uuid" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 when budgetPriority is invalid", async () => {
      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pantryId,
          budgetPriority: "ultra-luxury",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 when servings is 0 or > 50", async () => {
      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pantryId,
          servings: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 when dietaryRequirements or allergies are not arrays", async () => {
      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pantryId,
          dietaryRequirements: "vegan",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("2. Domain Validation & Resource Availability", () => {
    it("fails with 404 if pantry is not found or does not belong to user", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PANTRY_NOT_FOUND");
    });

    it("fails with 400 if pantry has 0 items", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Empty Pantry",
        items: [],
      });

      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("PANTRY_HAS_NO_ITEMS");
    });

    it("fails with 404 if mealPlanId is specified but meal plan does not exist", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Main Pantry",
        items: [
          { id: "item-1", name: "Pasta", quantity: 500, unit: "g", expiryDate: null },
        ],
      });
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId, mealPlanId });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MEAL_PLAN_NOT_FOUND");
    });
  });

  describe("3. Successful AI Recommendations & Cold-Start Behavior", () => {
    const mockAIResponse = {
      recommendations: [
        {
          recipeId: "recipe-1",
          title: "Garlic Tomato Pasta",
          reason: "Utilizes pantry pasta and fresh garlic expiring in 3 days.",
          matchScore: 92,
          servings: 2,
          prepTime: 10,
          cookTime: 15,
          estimatedCost: 3.5,
          pantryUsage: {
            percentage: 85,
            usedIngredients: ["Pasta", "Garlic", "Olive Oil"],
            missingIngredients: ["Parmesan Cheese"],
          },
          substitutions: [
            {
              ingredient: "Parmesan Cheese",
              substitute: "Nutritional Yeast or Pecorino",
              reason: "Enhances savory flavor without dairy.",
            },
          ],
          warnings: ["Ensure pasta is boiled in well-salted water."],
        },
      ],
    };

    it("successfully generates recommendations with existing recipes and pantry items", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Main Pantry",
        items: [
          {
            id: "item-1",
            name: "Pasta",
            quantity: 500,
            unit: "g",
            expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // expiring in 2 days
          },
          {
            id: "item-2",
            name: "Garlic",
            quantity: 3,
            unit: "cloves",
            expiryDate: null,
          },
        ],
      });

      vi.spyOn(prisma.recipe, "findMany").mockResolvedValue([
        {
          id: "recipe-1",
          title: "Garlic Tomato Pasta",
          description: "Quick weeknight dinner",
          prepTime: 10,
          cookTime: 15,
          servings: 2,
          ingredients: [
            { name: "Pasta", quantity: 200, unit: "g" },
            { name: "Garlic", quantity: 2, unit: "cloves" },
          ],
        },
      ]);

      vi.spyOn(prisma.userPreference, "findUnique").mockResolvedValue({
        userId,
        dietaryPreferences: ["vegetarian"],
        allergies: ["peanuts"],
        dislikedIngredients: ["mushrooms"],
        defaultServings: 2,
        maxCookingMinutes: 30,
        defaultBudget: 20,
      });

      const aiSpy = vi
        .spyOn(aiService, "generateStructuredAIResponse")
        .mockResolvedValue(mockAIResponse);

      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pantryId,
          cuisine: "Italian",
          dietaryRequirements: ["vegan"],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pantry.id).toBe(pantryId);
      expect(res.body.data.recommendations).toHaveLength(1);
      expect(res.body.data.recommendations[0].title).toBe("Garlic Tomato Pasta");
      expect(res.body.data.preferences.dietaryRequirements).toContain("vegetarian");
      expect(res.body.data.preferences.dietaryRequirements).toContain("vegan");
      expect(res.body.data.preferences.allergies).toContain("peanuts");

      expect(aiSpy).toHaveBeenCalled();
    });

    it("successfully generates cold-start recommendations when user has 0 saved recipes", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Bachelor Pantry",
        items: [
          { id: "item-1", name: "Eggs", quantity: 6, unit: "pieces", expiryDate: null },
          { id: "item-2", name: "Cheese", quantity: 200, unit: "g", expiryDate: null },
        ],
      });

      // 0 saved recipes in database
      vi.spyOn(prisma.recipe, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.userPreference, "findUnique").mockResolvedValue(null);

      const coldStartAIResponse = {
        recommendations: [
          {
            recipeId: "generated-1",
            title: "Classic Cheese Omelette",
            reason: "Uses eggs and cheese directly from pantry.",
            matchScore: 95,
            servings: 1,
            prepTime: 5,
            cookTime: 10,
            estimatedCost: 1.5,
            pantryUsage: {
              percentage: 100,
              usedIngredients: ["Eggs", "Cheese"],
              missingIngredients: [],
            },
            substitutions: [],
            warnings: [],
          },
        ],
      };

      vi.spyOn(aiService, "generateStructuredAIResponse").mockResolvedValue(coldStartAIResponse);

      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations[0].title).toBe("Classic Cheese Omelette");
      expect(res.body.data.recommendations[0].recipeId).toBe("generated-1");
    });
  });

  describe("4. AI Provider Failure Handling", () => {
    it("handles AI service 503 unavailable gracefully", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Main Pantry",
        items: [{ id: "item-1", name: "Rice", quantity: 1, unit: "kg", expiryDate: null }],
      });
      vi.spyOn(prisma.recipe, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.userPreference, "findUnique").mockResolvedValue(null);

      vi.spyOn(aiService, "generateStructuredAIResponse").mockRejectedValue(
        new (await import("../../src/utils/AppError.js")).default(
          "AI service is currently unavailable",
          503,
          "AI_SERVICE_UNAVAILABLE"
        )
      );

      const res = await supertest(app)
        .post("/api/v1/ai/recommendations")
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AI_SERVICE_UNAVAILABLE");
    });
  });
});
