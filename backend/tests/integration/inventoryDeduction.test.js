import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const createTestAuthToken = (userId = "user-uuid-1234") => {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Inventory Deduction Scaling & Cross-Unit Conversions Integration Tests", () => {
  const userId = "user-uuid-1234";
  const recipeId = "11111111-1111-4111-8111-111111111111";
  const pantryId = "22222222-2222-4222-8222-222222222222";
  const sessionId = "33333333-3333-4333-8333-333333333333";
  const token = createTestAuthToken(userId);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. POST /api/v1/recipes/:recipeId/consume", () => {
    it("fails with 401 when unauthenticated", async () => {
      const res = await supertest(app)
        .post(`/api/v1/recipes/${recipeId}/consume`)
        .send({ pantryId });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("fails with 400 when servings is 0 or negative", async () => {
      const res = await supertest(app)
        .post(`/api/v1/recipes/${recipeId}/consume`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId, servings: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 404 if recipe does not exist", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .post(`/api/v1/recipes/${recipeId}/consume`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId, servings: 2 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
    });

    it("fails with 400 if recipe has no ingredients", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: recipeId,
        userId,
        servings: 2,
        ingredients: [],
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      const res = await supertest(app)
        .post(`/api/v1/recipes/${recipeId}/consume`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RECIPE_HAS_NO_INGREDIENTS");
    });

    it("fails with 400 when an ingredient has incompatible units (e.g. g vs pieces)", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: recipeId,
        userId,
        servings: 2,
        ingredients: [
          { id: "ing-1", name: "Onion", quantity: 200, unit: "g" },
        ],
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const tx = {
          pantryItem: {
            findMany: vi.fn().mockResolvedValue([
              { id: "item-1", name: "Onion", quantity: 3, unit: "piece" },
            ]),
          },
        };
        return callback(tx);
      });

      const res = await supertest(app)
        .post(`/api/v1/recipes/${recipeId}/consume`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId, servings: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INCOMPATIBLE_UNIT");
    });

    it("fails with 400 when stock is insufficient for scaled servings", async () => {
      // Recipe requires 250g flour for 2 servings. When cooking 4 servings, requires 500g.
      // Pantry only has 300g.
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: recipeId,
        userId,
        servings: 2,
        ingredients: [
          { id: "ing-1", name: "Flour", quantity: 250, unit: "g" },
        ],
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const tx = {
          pantryItem: {
            findMany: vi.fn().mockResolvedValue([
              { id: "item-1", name: "Flour", quantity: 300, unit: "g" },
            ]),
          },
        };
        return callback(tx);
      });

      const res = await supertest(app)
        .post(`/api/v1/recipes/${recipeId}/consume`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId, servings: 4 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
    });

    it("deducts correctly with serving scaling and cross-unit conversion (g -> kg)", async () => {
      // Recipe base: 2 servings, 500g pasta and 1 liter tomato sauce
      // Requested servings: 4 (2x scaling)
      // Scaled required: 1000g pasta (1kg) and 2000ml tomato sauce (2l)
      // Pantry has: 2 kg pasta and 3 l tomato sauce
      // Expected deductions: 1 kg pasta from pantry, 2 l tomato sauce from pantry
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: recipeId,
        userId,
        servings: 2,
        ingredients: [
          { id: "ing-1", name: "Pasta", quantity: 500, unit: "g" },
          { id: "ing-2", name: "Tomato Sauce", quantity: 1, unit: "l" },
        ],
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      const updateManySpy = vi.fn().mockResolvedValue({ count: 1 });
      const updatedPantryItems = [
        { id: "item-1", name: "Pasta", quantity: 1, unit: "kg" },
        { id: "item-2", name: "Tomato Sauce", quantity: 1, unit: "l" },
      ];

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const tx = {
          pantryItem: {
            findMany: vi
              .fn()
              .mockResolvedValueOnce([
                { id: "item-1", name: "Pasta", quantity: 2, unit: "kg" },
                { id: "item-2", name: "Tomato Sauce", quantity: 3, unit: "l" },
              ])
              .mockResolvedValueOnce(updatedPantryItems),
            updateMany: updateManySpy,
          },
        };
        return callback(tx);
      });

      const res = await supertest(app)
        .post(`/api/v1/recipes/${recipeId}/consume`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId, servings: 4 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.servings).toBe(4);
      expect(res.body.data.scalingMultiplier).toBe(2);

      // Verify updateMany was called with 1kg deduction for pasta (500g * 2 = 1000g -> 1kg)
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "item-1" }),
          data: { quantity: { decrement: 1 } },
        })
      );

      // Verify updateMany was called with 2l deduction for tomato sauce (1l * 2 = 2l)
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "item-2" }),
          data: { quantity: { decrement: 2 } },
        })
      );
    });
  });

  describe("2. POST /api/v1/cooking-sessions/:sessionId/complete", () => {
    it("fails with 401 when unauthenticated", async () => {
      const res = await supertest(app)
        .post(`/api/v1/cooking-sessions/${sessionId}/complete`)
        .send({ pantryId });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("fails with 409 if session is already completed", async () => {
      vi.spyOn(prisma.cookingSession, "findFirst").mockResolvedValue({
        id: sessionId,
        userId,
        status: "completed",
        recipe: { ingredients: [{ name: "Rice", quantity: 100, unit: "g" }] },
      });

      const res = await supertest(app)
        .post(`/api/v1/cooking-sessions/${sessionId}/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("COOKING_SESSION_ALREADY_COMPLETED");
    });

    it("completes session with scaled ingredient deductions", async () => {
      // Recipe base: 2 servings, 200g rice.
      // Session servings: 6 (3x multiplier).
      // Required rice: 600g.
      // Pantry has: 1 kg rice.
      // Expected deduction in pantry unit: 0.6 kg.
      vi.spyOn(prisma.cookingSession, "findFirst").mockResolvedValue({
        id: sessionId,
        userId,
        status: "active",
        servings: 6,
        totalSteps: 5,
        recipe: {
          id: recipeId,
          servings: 2,
          ingredients: [
            { id: "ing-1", name: "Rice", quantity: 200, unit: "g" },
          ],
        },
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      const updateManySpy = vi.fn().mockResolvedValue({ count: 1 });
      const completedSessionMock = {
        id: sessionId,
        status: "completed",
        currentStep: 5,
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const tx = {
          pantryItem: {
            findMany: vi
              .fn()
              .mockResolvedValueOnce([
                { id: "item-1", name: "Rice", quantity: 1, unit: "kg" },
              ])
              .mockResolvedValueOnce([
                { id: "item-1", name: "Rice", quantity: 0.4, unit: "kg" },
              ]),
            updateMany: updateManySpy,
          },
          cookingSession: {
            update: vi.fn().mockResolvedValue(completedSessionMock),
          },
        };
        return callback(tx);
      });

      const res = await supertest(app)
        .post(`/api/v1/cooking-sessions/${sessionId}/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pantryId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.servings).toBe(6);
      expect(res.body.data.scalingMultiplier).toBe(3);

      // Verify updateMany decremented 0.6 kg (600g converted to kg)
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "item-1" }),
          data: { quantity: { decrement: 0.6 } },
        })
      );
    });
  });

  describe("3. GET /api/v1/recipes/:recipeId/pantries/:pantryId/availability", () => {
    it("returns availability with scaled required quantities and cross-unit matching", async () => {
      // Recipe: 2 servings, 500g pasta.
      // Availability query with ?servings=4 -> requiredQuantity: 1000g.
      // Pantry has: 2 kg pasta.
      // Status should be 'available'.
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: recipeId,
        title: "Creamy Pasta",
        userId,
        servings: 2,
        ingredients: [
          { id: "ing-1", name: "Pasta", quantity: 500, unit: "g" },
        ],
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        name: "Main Pantry",
        userId,
        items: [
          { id: "item-1", name: "Pasta", quantity: 2, unit: "kg" },
        ],
      });

      const res = await supertest(app)
        .get(`/api/v1/recipes/${recipeId}/pantries/${pantryId}/availability?servings=4`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipe.servings).toBe(4);
      expect(res.body.data.ingredients[0].requiredQuantity).toBe(1000);
      expect(res.body.data.ingredients[0].status).toBe("available");
      expect(res.body.data.summary.available).toBe(1);
    });
  });
});
