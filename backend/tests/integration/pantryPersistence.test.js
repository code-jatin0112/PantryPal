import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const createTestAuthToken = (userId = "user-uuid-100") => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

describe("Pantry Persistence & Low-Stock Thresholds Integration Tests (Phase 2)", () => {
  const user1Id = "11111111-1111-4111-8111-111111111111";
  const user2Id = "22222222-2222-4222-8222-222222222222";
  const user1Token = createTestAuthToken(user1Id);
  const user2Token = createTestAuthToken(user2Id);

  const pantryId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const itemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Pantry Item Persistence with New Fields", () => {
    it("POST /api/v1/pantries/:pantryId/items persists category, minimumQuantity, purchaseDate, and notes", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId: user1Id,
        name: "Kitchen Pantry",
      });

      const purchaseDate = "2026-11-01T00:00:00.000Z";
      const expiryDate = "2026-12-01T00:00:00.000Z";

      const createSpy = vi.spyOn(prisma.pantryItem, "create").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Greek Yogurt",
        quantity: 2,
        unit: "tubs",
        category: "Dairy",
        minimumQuantity: 3,
        purchaseDate: new Date(purchaseDate),
        notes: "Keep in the main fridge top shelf",
        expiryDate: new Date(expiryDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Greek Yogurt",
          quantity: 2,
          unit: "tubs",
          category: "Dairy",
          minimumQuantity: 3,
          purchaseDate,
          notes: "Keep in the main fridge top shelf",
          expiryDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.category).toBe("Dairy");
      expect(res.body.data.item.minimumQuantity).toBe(3);
      expect(res.body.data.item.notes).toBe("Keep in the main fridge top shelf");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pantryId,
            name: "Greek Yogurt",
            category: "Dairy",
            minimumQuantity: 3,
            notes: "Keep in the main fridge top shelf",
          }),
        })
      );
    });

    it("PATCH /api/v1/pantries/:pantryId/items/:itemId updates category, minimumQuantity, purchaseDate, and notes", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId: user1Id,
      });

      vi.spyOn(prisma.pantryItem, "findFirst").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Greek Yogurt",
        quantity: 2,
        unit: "tubs",
        category: "Dairy",
        minimumQuantity: 1,
      });

      const updateSpy = vi.spyOn(prisma.pantryItem, "update").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Greek Yogurt",
        quantity: 2,
        unit: "tubs",
        category: "Dairy & Eggs",
        minimumQuantity: 4,
        notes: "Updated note",
      });

      const res = await supertest(app)
        .patch(`/api/v1/pantries/${pantryId}/items/${itemId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          category: "Dairy & Eggs",
          minimumQuantity: 4,
          notes: "Updated note",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId },
          data: expect.objectContaining({
            category: "Dairy & Eggs",
            minimumQuantity: 4,
            notes: "Updated note",
          }),
        })
      );
    });

    it("maintains backward compatibility and defaults minimumQuantity to null when omitted", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId: user1Id,
      });

      const createSpy = vi.spyOn(prisma.pantryItem, "create").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Sea Salt",
        quantity: 1,
        unit: "kg",
        category: "Other",
        minimumQuantity: null,
        purchaseDate: null,
        notes: null,
        expiryDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Sea Salt",
          quantity: 1,
          unit: "kg",
        });

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pantryId,
            name: "Sea Salt",
            category: "Other",
            minimumQuantity: null,
            purchaseDate: null,
            notes: null,
          }),
        })
      );
    });

    it("verifies omitted minimumQuantity falls back to global threshold of 5 in low-stock calculation", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId: user1Id,
      });

      // Item with quantity 4 and minimumQuantity null should be caught by default threshold 5
      // Item with quantity 6 and minimumQuantity null should NOT be caught
      const mockItems = [
        { id: "item-1", pantryId, name: "Sea Salt", quantity: 4, minimumQuantity: null },
        { id: "item-2", pantryId, name: "Black Pepper", quantity: 6, minimumQuantity: null },
      ];

      vi.spyOn(prisma.pantryItem, "findMany").mockResolvedValue(mockItems);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}/low-stock`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe("Sea Salt");
    });
  });

  describe("2. Individual Per-Item Low-Stock Thresholds", () => {
    it("GET /api/v1/pantries/:pantryId/low-stock filters items using per-item minimumQuantity", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId: user1Id,
      });

      const allItems = [
        // Low stock because qty (2) <= minQty (5)
        { id: "item-1", pantryId, name: "Flour", quantity: 2, minimumQuantity: 5 },
        // Low stock because qty (8) <= minQty (10)
        { id: "item-2", pantryId, name: "Rice", quantity: 8, minimumQuantity: 10 },
        // NOT low stock because qty (4) > minQty (2)
        { id: "item-3", pantryId, name: "Sugar", quantity: 4, minimumQuantity: 2 },
        // Low stock via default fallback threshold (5) because minQty is null and qty (3) <= 5
        { id: "item-4", pantryId, name: "Pasta", quantity: 3, minimumQuantity: null },
        // NOT low stock via default fallback because minQty is null and qty (7) > 5
        { id: "item-5", pantryId, name: "Olive Oil", quantity: 7, minimumQuantity: null },
      ];

      vi.spyOn(prisma.pantryItem, "findMany").mockResolvedValue(allItems);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}/low-stock`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedNames = res.body.data.items.map((i) => i.name);
      expect(returnedNames).toContain("Flour");
      expect(returnedNames).toContain("Rice");
      expect(returnedNames).toContain("Pasta");
      expect(returnedNames).not.toContain("Sugar");
      expect(returnedNames).not.toContain("Olive Oil");
      expect(res.body.data.items).toHaveLength(3);
    });

    it("respects custom threshold query param for items without explicit minimumQuantity", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId: user1Id,
      });

      const allItems = [
        // Has minQty: 5, qty: 3 <= 5 -> low stock
        { id: "item-1", pantryId, name: "Flour", quantity: 3, minimumQuantity: 5 },
        // minQty is null, qty: 4 > custom threshold 2 -> NOT low stock
        { id: "item-2", pantryId, name: "Pasta", quantity: 4, minimumQuantity: null },
        // minQty is null, qty: 1 <= custom threshold 2 -> low stock
        { id: "item-3", pantryId, name: "Salt", quantity: 1, minimumQuantity: null },
      ];

      vi.spyOn(prisma.pantryItem, "findMany").mockResolvedValue(allItems);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}/low-stock?threshold=2`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      const returnedNames = res.body.data.items.map((i) => i.name);
      expect(returnedNames).toContain("Flour");
      expect(returnedNames).toContain("Salt");
      expect(returnedNames).not.toContain("Pasta");
    });
  });

  describe("3. Validation & Authorization Guards", () => {
    it("fails with 400 when minimumQuantity is negative", async () => {
      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Apples",
          quantity: 5,
          unit: "pcs",
          minimumQuantity: -2,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 when purchaseDate is not a valid date", async () => {
      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Apples",
          quantity: 5,
          unit: "pcs",
          purchaseDate: "not-a-real-date",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 when category exceeds 50 characters", async () => {
      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Apples",
          quantity: 5,
          unit: "pcs",
          category: "A".repeat(51),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 when notes exceeds 1000 characters", async () => {
      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Apples",
          quantity: 5,
          unit: "pcs",
          notes: "N".repeat(1001),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("prevents User 2 from creating items in User 1's pantry (returns 404)", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          name: "Stolen Item",
          quantity: 1,
          unit: "pcs",
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PANTRY_NOT_FOUND");
    });

    it("prevents User 2 from querying low stock for User 1's pantry (returns 404)", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}/low-stock`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PANTRY_NOT_FOUND");
    });
  });
});
