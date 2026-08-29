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

describe("User Preferences API Integration & Edge-Case Tests", () => {
  const userId = "user-uuid-1234";
  const token = createTestAuthToken(userId);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Authentication & Security Guards", () => {
    it("GET /api/v1/preferences fails with 401 when no token is provided", async () => {
      const res = await supertest(app).get("/api/v1/preferences");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("PUT /api/v1/preferences fails with 401 when no token is provided", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .send({
          dietaryPreferences: ["vegetarian"],
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("GET /api/v1/preferences fails with 401 on invalid token signature", async () => {
      const res = await supertest(app)
        .get("/api/v1/preferences")
        .set("Authorization", "Bearer invalid.jwt.token");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  describe("2. GET /api/v1/preferences (Atomic Upsert & Default Initialization)", () => {
    it("atomically upserts and returns default preferences on first read", async () => {
      const defaultRecord = {
        id: "pref-uuid-1",
        userId,
        dietaryPreferences: [],
        allergies: [],
        dislikedIngredients: [],
        defaultServings: 2,
        maxCookingMinutes: null,
        defaultBudget: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const upsertSpy = vi
        .spyOn(prisma.userPreference, "upsert")
        .mockResolvedValue(defaultRecord);

      const res = await supertest(app)
        .get("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences).toBeDefined();
      expect(res.body.data.preferences.defaultServings).toBe(2);
      expect(res.body.data.preferences.dietaryPreferences).toEqual([]);
      expect(upsertSpy).toHaveBeenCalledWith({
        where: { userId },
        update: {},
        create: {
          userId,
          dietaryPreferences: [],
          allergies: [],
          dislikedIngredients: [],
          defaultServings: 2,
          maxCookingMinutes: null,
          defaultBudget: null,
        },
      });
    });

    it("returns existing preferences if already present in database", async () => {
      const existingRecord = {
        id: "pref-uuid-1",
        userId,
        dietaryPreferences: ["vegan", "gluten-free"],
        allergies: ["peanuts"],
        dislikedIngredients: ["mushrooms"],
        defaultServings: 4,
        maxCookingMinutes: 30,
        defaultBudget: 25.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(prisma.userPreference, "upsert").mockResolvedValue(existingRecord);

      const res = await supertest(app)
        .get("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences.dietaryPreferences).toEqual(["vegan", "gluten-free"]);
      expect(res.body.data.preferences.defaultServings).toBe(4);
      expect(res.body.data.preferences.defaultBudget).toBe(25.5);
    });
  });

  describe("3. PUT /api/v1/preferences (Full & Partial Updates)", () => {
    it("updates all fields successfully with valid payload", async () => {
      const updatedRecord = {
        id: "pref-uuid-1",
        userId,
        dietaryPreferences: ["pescatarian"],
        allergies: ["dairy"],
        dislikedIngredients: ["cilantro"],
        defaultServings: 3,
        maxCookingMinutes: 45,
        defaultBudget: 30.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const upsertSpy = vi
        .spyOn(prisma.userPreference, "upsert")
        .mockResolvedValue(updatedRecord);

      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dietaryPreferences: ["pescatarian"],
          allergies: ["dairy"],
          dislikedIngredients: ["cilantro"],
          defaultServings: 3,
          maxCookingMinutes: 45,
          defaultBudget: 30.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences.defaultServings).toBe(3);
      expect(res.body.data.preferences.dietaryPreferences).toEqual(["pescatarian"]);
      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          update: expect.objectContaining({
            dietaryPreferences: ["pescatarian"],
            defaultServings: 3,
            maxCookingMinutes: 45,
            defaultBudget: 30.0,
          }),
        })
      );
    });

    it("allows partial updates without overwriting unmentioned fields", async () => {
      const partiallyUpdated = {
        id: "pref-uuid-1",
        userId,
        dietaryPreferences: ["vegan"],
        allergies: [],
        dislikedIngredients: [],
        defaultServings: 6,
        maxCookingMinutes: null,
        defaultBudget: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const upsertSpy = vi
        .spyOn(prisma.userPreference, "upsert")
        .mockResolvedValue(partiallyUpdated);

      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultServings: 6,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences.defaultServings).toBe(6);
      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          update: {
            defaultServings: 6,
          },
        })
      );
    });

    it("allows clearing array preferences by passing empty arrays", async () => {
      const clearedRecord = {
        id: "pref-uuid-1",
        userId,
        dietaryPreferences: [],
        allergies: [],
        dislikedIngredients: [],
        defaultServings: 2,
        maxCookingMinutes: null,
        defaultBudget: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const upsertSpy = vi
        .spyOn(prisma.userPreference, "upsert")
        .mockResolvedValue(clearedRecord);

      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dietaryPreferences: [],
          allergies: [],
          dislikedIngredients: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences.dietaryPreferences).toEqual([]);
      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          update: expect.objectContaining({
            dietaryPreferences: [],
            allergies: [],
            dislikedIngredients: [],
          }),
        })
      );
    });

    it("allows setting nullable fields (maxCookingMinutes, defaultBudget) to null explicitly", async () => {
      const nullFieldsRecord = {
        id: "pref-uuid-1",
        userId,
        dietaryPreferences: [],
        allergies: [],
        dislikedIngredients: [],
        defaultServings: 2,
        maxCookingMinutes: null,
        defaultBudget: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const upsertSpy = vi
        .spyOn(prisma.userPreference, "upsert")
        .mockResolvedValue(nullFieldsRecord);

      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          maxCookingMinutes: null,
          defaultBudget: null,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences.maxCookingMinutes).toBeNull();
      expect(res.body.data.preferences.defaultBudget).toBeNull();
      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          update: expect.objectContaining({
            maxCookingMinutes: null,
            defaultBudget: null,
          }),
        })
      );
    });
  });

  describe("4. Strict Validation Failures & Edge Cases", () => {
    it("rejects defaultServings = null with 400 (non-nullable DB field)", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultServings: null,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects defaultServings = 0 with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultServings: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects defaultServings > 50 with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultServings: 51,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects non-array dietaryPreferences with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dietaryPreferences: "vegetarian",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects dietaryPreferences = null with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dietaryPreferences: null,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects allergies = null with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          allergies: null,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects dislikedIngredients = null with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dislikedIngredients: null,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects non-array allergies with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          allergies: "peanuts",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects non-array dislikedIngredients with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          dislikedIngredients: 123,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects maxCookingMinutes less than 1 with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          maxCookingMinutes: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects maxCookingMinutes greater than 1440 with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          maxCookingMinutes: 1500,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects negative defaultBudget with 400", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultBudget: -10,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects invalid type for defaultBudget (string that is not a number)", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultBudget: "abc",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
