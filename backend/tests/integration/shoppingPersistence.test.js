import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const createTestAuthToken = (userId = "user-uuid-100") => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

describe("Shopping List Category & Priority Persistence Integration Tests (Phase 2)", () => {
  const user1Id = "11111111-1111-4111-8111-111111111111";
  const user2Id = "22222222-2222-4222-8222-222222222222";
  const user1Token = createTestAuthToken(user1Id);
  const user2Token = createTestAuthToken(user2Id);

  const itemId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Category & Priority Persistence on Create and Update", () => {
    it("POST /api/v1/shopping-list persists category and priority", async () => {
      const createSpy = vi.spyOn(prisma.shoppingListItem, "create").mockResolvedValue({
        id: itemId,
        userId: user1Id,
        recipeId: null,
        name: "Almond Milk",
        quantity: 2,
        unit: "cartons",
        category: "Dairy",
        priority: "HIGH",
        isPurchased: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await supertest(app)
        .post("/api/v1/shopping-list")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Almond Milk",
          quantity: 2,
          unit: "cartons",
          category: "Dairy",
          priority: "HIGH",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.category).toBe("Dairy");
      expect(res.body.data.item.priority).toBe("HIGH");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: user1Id,
            name: "Almond Milk",
            category: "Dairy",
            priority: "HIGH",
          }),
        })
      );
    });

    it("normalizes lowercase priority input to uppercase enum", async () => {
      const createSpy = vi.spyOn(prisma.shoppingListItem, "create").mockResolvedValue({
        id: itemId,
        userId: user1Id,
        name: "Avocados",
        quantity: 4,
        unit: "pieces",
        category: "Produce",
        priority: "LOW",
        isPurchased: false,
      });

      const res = await supertest(app)
        .post("/api/v1/shopping-list")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Avocados",
          quantity: 4,
          unit: "pieces",
          category: "Produce",
          priority: "low",
        });

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: "LOW",
          }),
        })
      );
    });

    it("PATCH /api/v1/shopping-list/:itemId updates category and priority", async () => {
      vi.spyOn(prisma.shoppingListItem, "findFirst").mockResolvedValue({
        id: itemId,
        userId: user1Id,
        name: "Almond Milk",
        quantity: 2,
        unit: "cartons",
        category: "Dairy",
        priority: "HIGH",
        isPurchased: false,
      });

      const updateSpy = vi.spyOn(prisma.shoppingListItem, "update").mockResolvedValue({
        id: itemId,
        userId: user1Id,
        name: "Almond Milk",
        quantity: 2,
        unit: "cartons",
        category: "Beverages",
        priority: "LOW",
        isPurchased: false,
      });

      const res = await supertest(app)
        .patch(`/api/v1/shopping-list/${itemId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          category: "Beverages",
          priority: "LOW",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId },
          data: expect.objectContaining({
            category: "Beverages",
            priority: "LOW",
          }),
        })
      );
    });

    it("defaults category to 'Other' and priority to 'MEDIUM' when omitted", async () => {
      const createSpy = vi.spyOn(prisma.shoppingListItem, "create").mockResolvedValue({
        id: itemId,
        userId: user1Id,
        name: "Paper Towels",
        quantity: 1,
        unit: "pack",
        category: "Other",
        priority: "MEDIUM",
        isPurchased: false,
      });

      const res = await supertest(app)
        .post("/api/v1/shopping-list")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Paper Towels",
          quantity: 1,
          unit: "pack",
        });

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "Other",
            priority: "MEDIUM",
          }),
        })
      );
    });
  });

  describe("2. Filtering by Category and Priority", () => {
    it("GET /api/v1/shopping-list passes category and priority query filters to service", async () => {
      const findManySpy = vi.spyOn(prisma.shoppingListItem, "findMany").mockResolvedValue([
        {
          id: itemId,
          userId: user1Id,
          name: "Apples",
          quantity: 6,
          unit: "pieces",
          category: "Produce",
          priority: "HIGH",
          isPurchased: false,
        },
      ]);

      const res = await supertest(app)
        .get("/api/v1/shopping-list?category=Produce&priority=HIGH")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: user1Id,
            category: "Produce",
            priority: "HIGH",
          }),
        })
      );
    });
  });

  describe("3. Validation & Authorization Guards", () => {
    it("fails with 400 when priority is invalid", async () => {
      const res = await supertest(app)
        .post("/api/v1/shopping-list")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Coffee",
          quantity: 1,
          unit: "bag",
          priority: "SUPER_URGENT",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 when category exceeds 50 characters", async () => {
      const res = await supertest(app)
        .post("/api/v1/shopping-list")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Coffee",
          quantity: 1,
          unit: "bag",
          category: "C".repeat(51),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("prevents User 2 from updating User 1's shopping list item (returns 404)", async () => {
      vi.spyOn(prisma.shoppingListItem, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .patch(`/api/v1/shopping-list/${itemId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          priority: "LOW",
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("SHOPPING_LIST_ITEM_NOT_FOUND");
    });

    it("prevents User 2 from fetching User 1's shopping list item by ID (returns 404)", async () => {
      vi.spyOn(prisma.shoppingListItem, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .get(`/api/v1/shopping-list/${itemId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("SHOPPING_LIST_ITEM_NOT_FOUND");
    });
  });
});
