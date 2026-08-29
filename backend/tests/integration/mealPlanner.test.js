import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const createTestAuthToken = (userId = "user-uuid-1234", expiresIn = "1h") => {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

describe("Meal Planner API Integration Tests (Sprint 4)", () => {
  const userId = "user-uuid-100";
  const otherUserId = "user-uuid-200";
  const mealPlanId = "11111111-1111-4111-8111-111111111111";
  const otherMealPlanId = "22222222-2222-4222-8222-222222222222";
  const recipeId = "33333333-3333-4333-8333-333333333333";
  const recipeId2 = "44444444-4444-4444-8444-444444444444";
  const foreignRecipeId = "55555555-5555-4555-8555-555555555555";
  const dishId = "66666666-6666-4666-8666-666666666666";
  const pantryId = "77777777-7777-4777-8777-777777777777";
  const token = createTestAuthToken(userId);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Authentication & Security Guards across Meal Planner Endpoints", () => {
    it("POST /api/v1/meal-plans fails with 401 when no token is provided", async () => {
      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .send({ name: "Unauthenticated Plan" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("GET /api/v1/meal-plans fails with 401 on malformed Authorization header", async () => {
      const res = await supertest(app)
        .get("/api/v1/meal-plans")
        .set("Authorization", "InvalidHeaderFormat");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_AUTH_HEADER");
    });

    it("GET /api/v1/meal-plans/:mealPlanId fails with 401 on invalid JWT signature", async () => {
      const res = await supertest(app)
        .get(`/api/v1/meal-plans/${mealPlanId}`)
        .set("Authorization", "Bearer invalid.signature.token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("POST /api/v1/meal-plans fails with 401 on expired JWT token", async () => {
      const expiredToken = createTestAuthToken(userId, "-1s");

      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ name: "Expired Plan" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  describe("2. POST /api/v1/meal-plans (Creation, Validation & Recipe Ownership)", () => {
    it("successfully creates a multi-dish meal plan in a transaction", async () => {
      vi.spyOn(prisma.recipe, "findMany").mockResolvedValue([
        { id: recipeId },
        { id: recipeId2 },
      ]);

      const mockCreatedPlan = {
        id: mealPlanId,
        userId,
        name: "Weekly Family Plan",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-07"),
        peopleCount: 4,
        budget: 150,
        items: [
          {
            id: dishId,
            recipeId,
            mealType: "dinner",
            requestedServings: 4,
            cuisine: "Italian",
            budgetPriority: "medium",
            recipe: {
              id: recipeId,
              title: "Spaghetti Bolognese",
              servings: 2,
            },
          },
        ],
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        return callback({
          mealPlan: {
            create: vi.fn().mockResolvedValue(mockCreatedPlan),
          },
        });
      });

      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Weekly Family Plan",
          startDate: "2026-09-01T00:00:00.000Z",
          endDate: "2026-09-07T00:00:00.000Z",
          peopleCount: 4,
          budget: 150,
          dishes: [
            {
              recipeId,
              requestedServings: 4,
              mealType: "dinner",
              cuisine: "Italian",
              budgetPriority: "medium",
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mealPlan.id).toBe(mealPlanId);
      expect(res.body.data.mealPlan.name).toBe("Weekly Family Plan");
      expect(res.body.data.mealPlan.items).toHaveLength(1);
    });

    it("fails with 400 INVALID_MEAL_PLAN_DATE_RANGE when endDate precedes startDate", async () => {
      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Invalid Date Plan",
          startDate: "2026-09-10T00:00:00.000Z",
          endDate: "2026-09-01T00:00:00.000Z",
          peopleCount: 2,
          dishes: [{ recipeId, requestedServings: 2 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_MEAL_PLAN_DATE_RANGE");
    });

    it("fails with 404 RECIPE_NOT_FOUND when dish references recipe not owned by user", async () => {
      vi.spyOn(prisma.recipe, "findMany").mockResolvedValue([]);

      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Foreign Recipe Plan",
          startDate: "2026-09-01T00:00:00.000Z",
          endDate: "2026-09-07T00:00:00.000Z",
          peopleCount: 2,
          dishes: [{ recipeId: foreignRecipeId, requestedServings: 2 }],
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
    });

    it("fails with 400 VALIDATION_ERROR when dishes array is empty", async () => {
      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Empty Dishes Plan",
          startDate: "2026-09-01T00:00:00.000Z",
          endDate: "2026-09-07T00:00:00.000Z",
          peopleCount: 2,
          dishes: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 VALIDATION_ERROR when budgetPriority has an invalid enum value", async () => {
      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Invalid Priority Plan",
          startDate: "2026-09-01T00:00:00.000Z",
          endDate: "2026-09-07T00:00:00.000Z",
          peopleCount: 2,
          dishes: [
            {
              recipeId,
              requestedServings: 2,
              budgetPriority: "ultra-high", // invalid enum
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 VALIDATION_ERROR when budget is negative", async () => {
      const res = await supertest(app)
        .post("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Negative Budget Plan",
          startDate: "2026-09-01T00:00:00.000Z",
          endDate: "2026-09-07T00:00:00.000Z",
          peopleCount: 2,
          budget: -25,
          dishes: [{ recipeId, requestedServings: 2 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("3. GET /api/v1/meal-plans (Listing & Tenant Isolation)", () => {
    it("lists meal plans belonging strictly to the authenticated user", async () => {
      const mockPlans = [
        {
          id: mealPlanId,
          userId,
          name: "September Week 1",
          startDate: new Date("2026-09-01"),
          endDate: new Date("2026-09-07"),
          peopleCount: 2,
          items: [],
        },
      ];

      const findSpy = vi
        .spyOn(prisma.mealPlan, "findMany")
        .mockResolvedValue(mockPlans);

      const res = await supertest(app)
        .get("/api/v1/meal-plans")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mealPlans).toHaveLength(1);
      expect(res.body.data.mealPlans[0].id).toBe(mealPlanId);

      // Verify tenant isolation filter
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId }),
        })
      );
    });

    it("applies optional date filters when query parameters are supplied", async () => {
      const findSpy = vi
        .spyOn(prisma.mealPlan, "findMany")
        .mockResolvedValue([]);

      const res = await supertest(app)
        .get("/api/v1/meal-plans?startDate=2026-09-01T00:00:00.000Z&endDate=2026-09-30T00:00:00.000Z")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            startDate: { lte: new Date("2026-09-30T00:00:00.000Z") },
            endDate: { gte: new Date("2026-09-01T00:00:00.000Z") },
          }),
        })
      );
    });
  });

  describe("4. GET, PATCH & DELETE /api/v1/meal-plans/:mealPlanId", () => {
    it("GET returns single meal plan with dishes and recipe details", async () => {
      const mockPlan = {
        id: mealPlanId,
        userId,
        name: "Details Plan",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-07"),
        peopleCount: 2,
        items: [
          {
            id: dishId,
            recipeId,
            recipe: { title: "Pasta Carbonara" },
          },
        ],
      };

      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue(mockPlan);

      const res = await supertest(app)
        .get(`/api/v1/meal-plans/${mealPlanId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mealPlan.id).toBe(mealPlanId);
      expect(res.body.data.mealPlan.items).toHaveLength(1);
    });

    it("GET fails with 404 MEAL_PLAN_NOT_FOUND when meal plan belongs to another user", async () => {
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .get(`/api/v1/meal-plans/${otherMealPlanId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("MEAL_PLAN_NOT_FOUND");
    });

    it("PATCH updates meal plan metadata successfully", async () => {
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue({
        id: mealPlanId,
        userId,
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-07"),
      });

      vi.spyOn(prisma.mealPlan, "update").mockResolvedValue({
        id: mealPlanId,
        userId,
        name: "Updated Plan Name",
        peopleCount: 5,
        items: [],
      });

      const res = await supertest(app)
        .patch(`/api/v1/meal-plans/${mealPlanId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Plan Name", peopleCount: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mealPlan.name).toBe("Updated Plan Name");
    });

    it("DELETE removes meal plan and returns 204 No Content", async () => {
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue({
        id: mealPlanId,
        userId,
      });
      vi.spyOn(prisma.mealPlan, "delete").mockResolvedValue({});

      const res = await supertest(app)
        .delete(`/api/v1/meal-plans/${mealPlanId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });

  describe("5. Meal Plan Dish Operations (POST, PATCH, DELETE /api/v1/meal-plans/:mealPlanId/dishes)", () => {
    it("POST adds a new dish to an existing meal plan", async () => {
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue({
        id: mealPlanId,
        userId,
        startDate: new Date("2026-09-01"),
      });

      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: recipeId,
        userId,
      });

      const mockDish = {
        id: dishId,
        mealPlanId,
        recipeId,
        requestedServings: 4,
        mealType: "lunch",
        recipe: { id: recipeId, title: "Greek Salad" },
      };

      vi.spyOn(prisma.mealPlanItem, "create").mockResolvedValue(mockDish);

      const res = await supertest(app)
        .post(`/api/v1/meal-plans/${mealPlanId}/dishes`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          recipeId,
          requestedServings: 4,
          mealType: "lunch",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dish.id).toBe(dishId);
      expect(res.body.data.dish.requestedServings).toBe(4);
    });

    it("PATCH updates dish servings and meal type", async () => {
      vi.spyOn(prisma.mealPlanItem, "findFirst").mockResolvedValue({
        id: dishId,
        mealPlanId,
      });

      vi.spyOn(prisma.mealPlanItem, "update").mockResolvedValue({
        id: dishId,
        mealPlanId,
        recipeId,
        requestedServings: 6,
        mealType: "dinner",
        recipe: { id: recipeId, title: "Greek Salad" },
      });

      const res = await supertest(app)
        .patch(`/api/v1/meal-plans/${mealPlanId}/dishes/${dishId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ requestedServings: 6, mealType: "dinner" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dish.requestedServings).toBe(6);
    });

    it("DELETE removes dish from meal plan and returns 204 No Content", async () => {
      vi.spyOn(prisma.mealPlanItem, "findFirst").mockResolvedValue({
        id: dishId,
        mealPlanId,
      });
      vi.spyOn(prisma.mealPlanItem, "delete").mockResolvedValue({});

      const res = await supertest(app)
        .delete(`/api/v1/meal-plans/${mealPlanId}/dishes/${dishId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });

  describe("6. Evaluation & Grocery Requirements (POST /evaluate & /grocery-requirements)", () => {
    it("POST /evaluate computes pantry coverage, shortages, and nutrition metrics", async () => {
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue({
        id: mealPlanId,
        userId,
        name: "Dinner Plan",
        peopleCount: 2,
        budget: 50,
        items: [
          {
            id: dishId,
            recipeId,
            requestedServings: 2,
            recipe: {
              id: recipeId,
              title: "Tomato Soup",
              servings: 2,
              ingredients: [
                { name: "Tomato", quantity: 4, unit: "pieces" },
                { name: "Cream", quantity: 100, unit: "ml" },
              ],
              nutrition: {
                calories: 300,
                protein: 5,
                carbohydrates: 25,
                fat: 15,
                fiber: 4,
              },
            },
          },
        ],
      });

      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "My Pantry",
        items: [
          { name: "Tomato", quantity: 2, unit: "pieces" },
        ],
      });

      const res = await supertest(app)
        .post(`/api/v1/meal-plans/${mealPlanId}/evaluate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mealPlan.id).toBe(mealPlanId);
      expect(res.body.data.dishes).toHaveLength(1);
      expect(res.body.data.grocery.items).toBeDefined();
      expect(res.body.data.nutrition).toBeDefined();
    });

    it("POST /grocery-requirements aggregates consolidated shortages with sourceDishIds", async () => {
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue({
        id: mealPlanId,
        userId,
        name: "Dinner Plan",
        peopleCount: 2,
        budget: 50,
        items: [
          {
            id: dishId,
            recipeId,
            requestedServings: 2,
            recipe: {
              id: recipeId,
              title: "Tomato Soup",
              servings: 2,
              ingredients: [
                { name: "Tomato", quantity: 4, unit: "pieces" },
              ],
              nutrition: null,
            },
          },
        ],
      });

      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "My Pantry",
        items: [],
      });

      const res = await supertest(app)
        .post(`/api/v1/meal-plans/${mealPlanId}/grocery-requirements`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it("POST /evaluate fails with 404 PANTRY_NOT_FOUND when pantry belongs to another user", async () => {
      vi.spyOn(prisma.mealPlan, "findFirst").mockResolvedValue({
        id: mealPlanId,
        userId,
        items: [{ id: dishId }],
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .post(`/api/v1/meal-plans/${mealPlanId}/evaluate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PANTRY_NOT_FOUND");
    });
  });
});
