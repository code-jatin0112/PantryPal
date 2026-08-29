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

describe("Pantry & Items CRUD Integration Tests (Sprint 3)", () => {
  const userId = "user-uuid-100";
  const otherUserId = "user-uuid-200";
  const pantryId = "11111111-1111-4111-8111-111111111111";
  const otherPantryId = "22222222-2222-4222-8222-222222222222";
  const itemId = "33333333-3333-4333-8333-333333333333";
  const token = createTestAuthToken(userId);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Pantry Container Operations (POST, GET, PATCH, DELETE /api/v1/pantries)", () => {
    it("POST /api/v1/pantries creates a new pantry with custom name", async () => {
      const mockPantry = {
        id: pantryId,
        userId,
        name: "Kitchen Main Pantry",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.pantry, "create").mockResolvedValue(mockPantry);

      const res = await supertest(app)
        .post("/api/v1/pantries")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Kitchen Main Pantry" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pantry.id).toBe(pantryId);
      expect(res.body.data.pantry.name).toBe("Kitchen Main Pantry");
    });

    it("POST /api/v1/pantries creates pantry with default name when omitted", async () => {
      const mockPantry = {
        id: pantryId,
        userId,
        name: "My Pantry",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createSpy = vi
        .spyOn(prisma.pantry, "create")
        .mockResolvedValue(mockPantry);

      const res = await supertest(app)
        .post("/api/v1/pantries")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.data.pantry.name).toBe("My Pantry");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            name: "My Pantry",
          }),
        })
      );
    });

    it("POST /api/v1/pantries fails with 401 when no token is provided", async () => {
      const res = await supertest(app)
        .post("/api/v1/pantries")
        .send({ name: "Unauth Pantry" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("POST /api/v1/pantries fails with 400 when name exceeds 100 chars", async () => {
      const res = await supertest(app)
        .post("/api/v1/pantries")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "A".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/pantries lists pantries belonging to authenticated user", async () => {
      const mockPantries = [
        {
          id: pantryId,
          name: "Main Pantry",
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { items: 5 },
        },
      ];

      const findSpy = vi
        .spyOn(prisma.pantry, "findMany")
        .mockResolvedValue(mockPantries);

      const res = await supertest(app)
        .get("/api/v1/pantries")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pantries).toHaveLength(1);
      expect(res.body.data.pantries[0].id).toBe(pantryId);

      // Verify tenant isolation query filter
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        })
      );
    });

    it("GET /api/v1/pantries/:pantryId returns single pantry details and items", async () => {
      const mockPantry = {
        id: pantryId,
        userId,
        name: "Dry Storage",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: itemId, name: "Rice", quantity: 2, unit: "kg" },
        ],
      };

      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue(mockPantry);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pantry.id).toBe(pantryId);
      expect(res.body.data.pantry.items).toHaveLength(1);
    });

    it("GET /api/v1/pantries/:pantryId fails with 404 when pantry belongs to another user", async () => {
      // User isolation: pantry exists for otherUserId, but returns null for userId
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${otherPantryId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("PANTRY_NOT_FOUND");
    });

    it("PATCH /api/v1/pantries/:pantryId updates pantry name", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Old Name",
      });

      vi.spyOn(prisma.pantry, "update").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Renamed Pantry",
        updatedAt: new Date(),
      });

      const res = await supertest(app)
        .patch(`/api/v1/pantries/${pantryId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Renamed Pantry" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pantry.name).toBe("Renamed Pantry");
    });

    it("DELETE /api/v1/pantries/:pantryId deletes pantry and returns 204", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "To Delete",
      });

      const deleteSpy = vi
        .spyOn(prisma.pantry, "delete")
        .mockResolvedValue({});

      const res = await supertest(app)
        .delete(`/api/v1/pantries/${pantryId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: pantryId },
      });
    });
  });

  describe("2. Pantry Items Operations (POST, GET, PATCH, DELETE, ADJUST)", () => {
    it("POST /api/v1/pantries/:pantryId/items creates an item with trimmed fields", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
        name: "Main Pantry",
      });

      const createSpy = vi.spyOn(prisma.pantryItem, "create").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Olive Oil",
        quantity: 500,
        unit: "ml",
        expiryDate: new Date("2027-01-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "  Olive Oil  ",
          quantity: 500,
          unit: "  ml  ",
          expiryDate: "2027-01-01T00:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.id).toBe(itemId);
      expect(res.body.data.item.name).toBe("Olive Oil");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pantryId,
            name: "Olive Oil",
            unit: "ml",
            quantity: 500,
          }),
        })
      );
    });

    it("POST /api/v1/pantries/:pantryId/items fails with 400 when quantity is zero or negative", async () => {
      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Flour",
          quantity: 0,
          unit: "kg",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("POST /api/v1/pantries/:pantryId/items fails with 404 if pantry belongs to another user", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .post(`/api/v1/pantries/${otherPantryId}/items`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Sugar",
          quantity: 1,
          unit: "kg",
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PANTRY_NOT_FOUND");
    });

    it("GET /api/v1/pantries/:pantryId/items lists all items in pantry", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      const mockItems = [
        { id: itemId, pantryId, name: "Salt", quantity: 1, unit: "kg" },
        { id: "item-2", pantryId, name: "Pepper", quantity: 50, unit: "g" },
      ];

      vi.spyOn(prisma.pantryItem, "findMany").mockResolvedValue(mockItems);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}/items`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
    });

    it("GET /api/v1/pantries/:pantryId/items/:itemId returns single pantry item", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      vi.spyOn(prisma.pantryItem, "findFirst").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Butter",
        quantity: 250,
        unit: "g",
      });

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}/items/${itemId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.name).toBe("Butter");
    });

    it("GET /api/v1/pantries/:pantryId/items/:itemId fails with 404 when item does not exist", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });
      vi.spyOn(prisma.pantryItem, "findFirst").mockResolvedValue(null);

      const res = await supertest(app)
        .get(`/api/v1/pantries/${pantryId}/items/${itemId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PANTRY_ITEM_NOT_FOUND");
    });

    it("PATCH /api/v1/pantries/:pantryId/items/:itemId performs partial update", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      vi.spyOn(prisma.pantryItem, "findFirst").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Milk",
        quantity: 1,
        unit: "l",
      });

      const updateSpy = vi.spyOn(prisma.pantryItem, "update").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Almond Milk",
        quantity: 1,
        unit: "l",
      });

      const res = await supertest(app)
        .patch(`/api/v1/pantries/${pantryId}/items/${itemId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Almond Milk" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId },
          data: { name: "Almond Milk" },
        })
      );
    });

    it("DELETE /api/v1/pantries/:pantryId/items/:itemId deletes item and returns 204", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      vi.spyOn(prisma.pantryItem, "findFirst").mockResolvedValue({
        id: itemId,
        pantryId,
      });

      const deleteSpy = vi.spyOn(prisma.pantryItem, "delete").mockResolvedValue({});

      const res = await supertest(app)
        .delete(`/api/v1/pantries/${pantryId}/items/${itemId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: itemId },
      });
    });

    it("POST /api/v1/pantries/:pantryId/items/:itemId/adjust increments quantity on positive change", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      vi.spyOn(prisma.pantryItem, "findFirst").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Apples",
        quantity: 4,
        unit: "pieces",
      });

      vi.spyOn(prisma.pantryItem, "update").mockResolvedValue({});
      vi.spyOn(prisma.pantryItem, "findUnique").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Apples",
        quantity: 6,
        unit: "pieces",
      });

      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items/${itemId}/adjust`)
        .set("Authorization", `Bearer ${token}`)
        .send({ change: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.quantity).toBe(6);
    });

    it("POST /api/v1/pantries/:pantryId/items/:itemId/adjust fails with 400 INSUFFICIENT_STOCK if decrement exceeds stock", async () => {
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: pantryId,
        userId,
      });

      vi.spyOn(prisma.pantryItem, "findFirst").mockResolvedValue({
        id: itemId,
        pantryId,
        name: "Apples",
        quantity: 2,
        unit: "pieces",
      });

      // Atomic updateMany returns count: 0 when quantity < amountToRemove
      vi.spyOn(prisma.pantryItem, "updateMany").mockResolvedValue({ count: 0 });

      const res = await supertest(app)
        .post(`/api/v1/pantries/${pantryId}/items/${itemId}/adjust`)
        .set("Authorization", `Bearer ${token}`)
        .send({ change: -5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
      expect(res.body.error.message).toContain("cannot become negative");
    });
  });
});
