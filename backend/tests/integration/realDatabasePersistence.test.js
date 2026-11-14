import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { generateAccessToken } from "../../src/utils/token.js";

describe("Real PostgreSQL Database Persistence & Migration Tests", () => {
  let testUser;
  let testAuthToken;
  let testPantry;

  beforeAll(async () => {
    // Create an isolated real test user in the PostgreSQL database
    testUser = await prisma.user.create({
      data: {
        name: "DB Verifier User",
        email: `db-verifier-${Date.now()}@test.com`,
        password: "hashedPassword123!",
        isActive: true,
      },
    });

    testAuthToken = generateAccessToken(testUser.id);

    // Create a real pantry for this test user
    testPantry = await prisma.pantry.create({
      data: {
        name: "Test Verification Pantry",
        userId: testUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up created test data cascading from the test user
    if (testUser?.id) {
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
    await prisma.$disconnect();
  });

  describe("1. Pantry Metadata Persistence and Reload", () => {
    it("persists category, minimumQuantity, purchaseDate, and notes to PostgreSQL and reloads accurately", async () => {
      const purchaseDate = "2026-11-01T10:00:00.000Z";
      const expiryDate = "2026-12-01T10:00:00.000Z";

      // Create pantry item via API
      const res = await supertest(app)
        .post(`/api/v1/pantries/${testPantry.id}/items`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Fresh Whole Milk",
          quantity: 2,
          unit: "liters",
          category: "Dairy",
          minimumQuantity: 4,
          purchaseDate,
          expiryDate,
          notes: "Glass bottle from local farm",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const createdItem = res.body.data.item;
      expect(createdItem.id).toBeDefined();

      // Reload directly from PostgreSQL database via Prisma
      const dbItem = await prisma.pantryItem.findUnique({
        where: { id: createdItem.id },
      });

      expect(dbItem).not.toBeNull();
      expect(dbItem.name).toBe("Fresh Whole Milk");
      expect(dbItem.category).toBe("Dairy");
      expect(dbItem.minimumQuantity).toBe(4);
      expect(dbItem.notes).toBe("Glass bottle from local farm");
      expect(new Date(dbItem.purchaseDate).toISOString()).toBe(purchaseDate);
      expect(new Date(dbItem.expiryDate).toISOString()).toBe(expiryDate);

      // Reload via API endpoint
      const getRes = await supertest(app)
        .get(`/api/v1/pantries/${testPantry.id}/items`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(getRes.status).toBe(200);
      const items = getRes.body.data.items;
      const reloadedItem = items.find((i) => i.id === createdItem.id);
      expect(reloadedItem).toBeDefined();
      expect(reloadedItem.category).toBe("Dairy");
      expect(reloadedItem.minimumQuantity).toBe(4);
      expect(reloadedItem.notes).toBe("Glass bottle from local farm");
      expect(new Date(reloadedItem.purchaseDate).toISOString()).toBe(purchaseDate);
    });

    it("updates pantry item metadata in PostgreSQL and preserves values on reload", async () => {
      // Create initial item
      const createRes = await supertest(app)
        .post(`/api/v1/pantries/${testPantry.id}/items`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Sourdough Bread",
          quantity: 1,
          unit: "loaf",
          category: "Bakery",
        });

      const itemId = createRes.body.data.item.id;

      // Update metadata
      const updateRes = await supertest(app)
        .patch(`/api/v1/pantries/${testPantry.id}/items/${itemId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Artisan Sourdough Bread",
          quantity: 2,
          unit: "loaves",
          category: "Bakery",
          minimumQuantity: 3,
          notes: "Store in cloth bag",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.item.name).toBe("Artisan Sourdough Bread");
      expect(updateRes.body.data.item.minimumQuantity).toBe(3);
      expect(updateRes.body.data.item.notes).toBe("Store in cloth bag");

      // Verify in PostgreSQL
      const dbItem = await prisma.pantryItem.findUnique({
        where: { id: itemId },
      });
      expect(dbItem.name).toBe("Artisan Sourdough Bread");
      expect(dbItem.quantity).toBe(2);
      expect(dbItem.minimumQuantity).toBe(3);
      expect(dbItem.notes).toBe("Store in cloth bag");
    });
  });

  describe("2. Low-Stock Thresholds: Null Fallback vs Explicit Values in Real Database", () => {
    it("null threshold uses global fallback (5 units): quantity <= 5 is low stock, quantity > 5 is not", async () => {
      // Item A: omitted minimumQuantity -> null in DB, quantity = 3 (<= 5) -> should be low stock
      const itemLow = await supertest(app)
        .post(`/api/v1/pantries/${testPantry.id}/items`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Unset Threshold Low Stock Item",
          quantity: 3,
          unit: "cans",
        });
      expect(itemLow.status).toBe(201);
      expect(itemLow.body.data.item.minimumQuantity).toBeNull();

      // Item B: omitted minimumQuantity -> null in DB, quantity = 8 (> 5) -> should NOT be low stock
      const itemAdequate = await supertest(app)
        .post(`/api/v1/pantries/${testPantry.id}/items`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Unset Threshold Adequate Item",
          quantity: 8,
          unit: "cans",
        });
      expect(itemAdequate.status).toBe(201);
      expect(itemAdequate.body.data.item.minimumQuantity).toBeNull();

      // Query low-stock endpoint from database
      const lowStockRes = await supertest(app)
        .get(`/api/v1/pantries/${testPantry.id}/low-stock`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(lowStockRes.status).toBe(200);
      const lowStockItems = lowStockRes.body.data.items;
      const lowIds = lowStockItems.map((i) => i.id);

      expect(lowIds).toContain(itemLow.body.data.item.id);
      expect(lowIds).not.toContain(itemAdequate.body.data.item.id);
    });

    it("explicit threshold remains unchanged and overrides the global fallback", async () => {
      // Item C: explicit minimumQuantity = 10, quantity = 7 (> global 5, but <= explicit 10) -> LOW STOCK
      const itemHighThreshold = await supertest(app)
        .post(`/api/v1/pantries/${testPantry.id}/items`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Bulk Sugar",
          quantity: 7,
          unit: "kg",
          minimumQuantity: 10,
        });
      expect(itemHighThreshold.status).toBe(201);

      // Item D: explicit minimumQuantity = 1, quantity = 2 (<= global 5, but > explicit 1) -> NOT LOW STOCK
      const itemLowThreshold = await supertest(app)
        .post(`/api/v1/pantries/${testPantry.id}/items`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Saffron",
          quantity: 2,
          unit: "grams",
          minimumQuantity: 1,
        });
      expect(itemLowThreshold.status).toBe(201);

      // Query low-stock endpoint
      const lowStockRes = await supertest(app)
        .get(`/api/v1/pantries/${testPantry.id}/low-stock`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(lowStockRes.status).toBe(200);
      const lowStockItems = lowStockRes.body.data.items;
      const lowIds = lowStockItems.map((i) => i.id);

      expect(lowIds).toContain(itemHighThreshold.body.data.item.id);
      expect(lowIds).not.toContain(itemLowThreshold.body.data.item.id);
    });
  });

  describe("3. Shopping List Category and Priority Persistence in Real Database", () => {
    it("persists category and priority, normalizes priority, and allows filtering by priority", async () => {
      // Create high priority item
      const item1 = await supertest(app)
        .post("/api/v1/shopping-list")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Olive Oil",
          quantity: 1,
          unit: "bottle",
          category: "Pantry Staples",
          priority: "HIGH",
        });
      expect(item1.status).toBe(201);
      expect(item1.body.data.item.category).toBe("Pantry Staples");
      expect(item1.body.data.item.priority).toBe("HIGH");

      // Create lowercase 'low' priority item to verify case normalization
      const item2 = await supertest(app)
        .post("/api/v1/shopping-list")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send({
          name: "Napkins",
          quantity: 2,
          unit: "packs",
          category: "Household",
          priority: "low",
        });
      expect(item2.status).toBe(201);
      expect(item2.body.data.item.priority).toBe("LOW");

      // Verify directly in PostgreSQL
      const dbItem1 = await prisma.shoppingListItem.findUnique({
        where: { id: item1.body.data.item.id },
      });
      expect(dbItem1.priority).toBe("HIGH");
      expect(dbItem1.category).toBe("Pantry Staples");

      const dbItem2 = await prisma.shoppingListItem.findUnique({
        where: { id: item2.body.data.item.id },
      });
      expect(dbItem2.priority).toBe("LOW");

      // Verify filtering by priority via API
      const filterRes = await supertest(app)
        .get("/api/v1/shopping-list?priority=HIGH")
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(filterRes.status).toBe(200);
      const filtered = filterRes.body.data.items;
      expect(filtered.some((i) => i.id === item1.body.data.item.id)).toBe(true);
      expect(filtered.some((i) => i.id === item2.body.data.item.id)).toBe(false);
    });
  });

  describe("4. Migration Record Preservation", () => {
    it("preserves pre-existing pantry records across migrations without data loss", async () => {
      const existingItems = await prisma.pantryItem.findMany();
      expect(existingItems.length).toBeGreaterThanOrEqual(19);

      // Verify Tomato still exists with quantity 6 and valid structure
      const tomato = existingItems.find((i) => i.name === "Tomato");
      expect(tomato).toBeDefined();
      expect(tomato.quantity).toBe(6);
      expect(tomato.minimumQuantity).toBeNull();
      expect(tomato.category).toBe("Other");

      // Verify Rice still exists
      const rice = existingItems.find((i) => i.name === "Rice");
      expect(rice).toBeDefined();
      expect(rice.quantity).toBe(2);
      expect(rice.minimumQuantity).toBeNull();
    });
  });
});
