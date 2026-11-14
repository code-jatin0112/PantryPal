import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const createTestAuthToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

describe("Recipe Favorites Integration & Authorization Tests", () => {
  const user1Id = "11111111-1111-4111-8111-111111111111";
  const user2Id = "22222222-2222-4222-8222-222222222222";
  const user1Token = createTestAuthToken(user1Id);
  const user2Token = createTestAuthToken(user2Id);

  const user1RecipeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const user2RecipeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Route Conflict Resolution (GET /favorites vs GET /:recipeId)", () => {
    it("routes GET /api/v1/recipes/favorites to favorites controller rather than recipeId route", async () => {
      const mockFavorites = [
        {
          id: "fav-1",
          userId: user1Id,
          recipeId: user1RecipeId,
          createdAt: new Date().toISOString(),
          recipe: {
            id: user1RecipeId,
            title: "Tuscan Chicken",
            description: "Delicious pasta and chicken",
            prepTime: 10,
            cookTime: 20,
            servings: 4,
          },
        },
      ];

      const findManySpy = vi
        .spyOn(prisma.recipeFavorite, "findMany")
        .mockResolvedValue(mockFavorites);

      const res = await supertest(app)
        .get("/api/v1/recipes/favorites")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.favorites).toHaveLength(1);
      expect(res.body.data.favorites[0].recipe.title).toBe("Tuscan Chicken");
      expect(findManySpy).toHaveBeenCalledWith({
        where: {
          userId: user1Id,
          recipe: {
            userId: user1Id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              description: true,
              prepTime: true,
              cookTime: true,
              servings: true,
            },
          },
        },
      });
    });
  });

  describe("2. Authentication & Validation Guards", () => {
    it("returns 401 when no token is provided for favorites list", async () => {
      const res = await supertest(app).get("/api/v1/recipes/favorites");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("returns 401 when no token is provided for adding a favorite", async () => {
      const res = await supertest(app).post(
        `/api/v1/recipes/${user1RecipeId}/favorite`
      );
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("returns 401 when no token is provided for checking favorite status", async () => {
      const res = await supertest(app).get(
        `/api/v1/recipes/${user1RecipeId}/favorite/status`
      );
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("returns 401 when no token is provided for deleting a favorite", async () => {
      const res = await supertest(app).delete(
        `/api/v1/recipes/${user1RecipeId}/favorite`
      );
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("returns 400 when recipeId is not a valid UUID", async () => {
      const res = await supertest(app)
        .post("/api/v1/recipes/invalid-uuid/favorite")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("3. Multi-User Authorization & Isolation", () => {
    it("prevents User 2 from favoriting a recipe owned by User 1 (returns 404)", async () => {
      // User 2 queries for User 1's recipe: scoped by { id: user1RecipeId, userId: user2Id }
      vi.spyOn(prisma.recipe, "findFirst").mockImplementation(
        async ({ where }) => {
          if (where.id === user1RecipeId && where.userId === user2Id) {
            return null; // recipe does not belong to user 2
          }
          if (where.id === user1RecipeId && where.userId === user1Id) {
            return { id: user1RecipeId, userId: user1Id, title: "User 1 Secret Recipe" };
          }
          return null;
        }
      );

      const res = await supertest(app)
        .post(`/api/v1/recipes/${user1RecipeId}/favorite`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
    });

    it("prevents User 2 from checking favorite status of User 1's recipe (returns 404)", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockImplementation(
        async ({ where }) => {
          if (where.id === user1RecipeId && where.userId === user2Id) {
            return null;
          }
          return null;
        }
      );

      const res = await supertest(app)
        .get(`/api/v1/recipes/${user1RecipeId}/favorite/status`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
    });

    it("prevents User 2 from deleting favorite on User 1's recipe (returns 404)", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockImplementation(
        async ({ where }) => {
          if (where.id === user1RecipeId && where.userId === user2Id) {
            return null;
          }
          return null;
        }
      );

      const res = await supertest(app)
        .delete(`/api/v1/recipes/${user1RecipeId}/favorite`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
    });
  });

  describe("4. Recipe Favorite CRUD & Consistency", () => {
    it("allows user to favorite their own recipe successfully (returns 201)", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: user1RecipeId,
        userId: user1Id,
        title: "User 1 Recipe",
      });
      vi.spyOn(prisma.recipeFavorite, "findUnique").mockResolvedValue(null);
      vi.spyOn(prisma.recipeFavorite, "create").mockResolvedValue({
        id: "fav-123",
        userId: user1Id,
        recipeId: user1RecipeId,
        createdAt: new Date().toISOString(),
        recipe: {
          id: user1RecipeId,
          title: "User 1 Recipe",
          description: "A nice dish",
          prepTime: 15,
          cookTime: 25,
          servings: 2,
        },
      });

      const res = await supertest(app)
        .post(`/api/v1/recipes/${user1RecipeId}/favorite`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.favorite.id).toBe("fav-123");
      expect(res.body.data.favorite.recipeId).toBe(user1RecipeId);
    });

    it("returns 409 Conflict when recipe is already favorited", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: user1RecipeId,
        userId: user1Id,
        title: "User 1 Recipe",
      });
      vi.spyOn(prisma.recipeFavorite, "findUnique").mockResolvedValue({
        id: "fav-existing",
        userId: user1Id,
        recipeId: user1RecipeId,
      });

      const res = await supertest(app)
        .post(`/api/v1/recipes/${user1RecipeId}/favorite`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RECIPE_ALREADY_FAVORITED");
    });

    it("returns both isFavorited and isFavorite boolean flags in favorite status check", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: user1RecipeId,
        userId: user1Id,
      });
      vi.spyOn(prisma.recipeFavorite, "findUnique").mockResolvedValue({
        id: "fav-123",
        userId: user1Id,
        recipeId: user1RecipeId,
      });

      const res = await supertest(app)
        .get(`/api/v1/recipes/${user1RecipeId}/favorite/status`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFavorited).toBe(true);
      expect(res.body.data.isFavorite).toBe(true);
    });

    it("returns isFavorited=false and isFavorite=false when recipe is not favorited", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: user1RecipeId,
        userId: user1Id,
      });
      vi.spyOn(prisma.recipeFavorite, "findUnique").mockResolvedValue(null);

      const res = await supertest(app)
        .get(`/api/v1/recipes/${user1RecipeId}/favorite/status`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFavorited).toBe(false);
      expect(res.body.data.isFavorite).toBe(false);
    });

    it("deletes favorite successfully (returns 204)", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: user1RecipeId,
        userId: user1Id,
      });
      vi.spyOn(prisma.recipeFavorite, "findUnique").mockResolvedValue({
        id: "fav-123",
        userId: user1Id,
        recipeId: user1RecipeId,
      });
      const deleteSpy = vi
        .spyOn(prisma.recipeFavorite, "delete")
        .mockResolvedValue({});

      const res = await supertest(app)
        .delete(`/api/v1/recipes/${user1RecipeId}/favorite`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(204);
      expect(deleteSpy).toHaveBeenCalledWith({
        where: {
          userId_recipeId: {
            userId: user1Id,
            recipeId: user1RecipeId,
          },
        },
      });
    });

    it("returns 404 when attempting to delete a favorite that does not exist", async () => {
      vi.spyOn(prisma.recipe, "findFirst").mockResolvedValue({
        id: user1RecipeId,
        userId: user1Id,
      });
      vi.spyOn(prisma.recipeFavorite, "findUnique").mockResolvedValue(null);

      const res = await supertest(app)
        .delete(`/api/v1/recipes/${user1RecipeId}/favorite`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RECIPE_FAVORITE_NOT_FOUND");
    });
  });
});
