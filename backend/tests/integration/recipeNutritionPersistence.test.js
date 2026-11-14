import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { generateAccessToken } from "../../src/utils/token.js";

describe("Recipe Editing, Ingredients & Nutrition Atomic Persistence Tests (Phase 3)", () => {
  let user1;
  let user1Token;
  let user2;
  let user2Token;

  beforeAll(async () => {
    // Safety Guard: disallow production
    const dbUrl = process.env.DATABASE_URL || "";
    const isProduction =
      process.env.NODE_ENV === "production" ||
      /(prod|production|supabase\.co|neon\.tech|railway\.app|aws\.com)/i.test(dbUrl);

    if (isProduction) {
      throw new Error("CRITICAL SAFETY GUARD: Refusing to run tests against a production database!");
    }

    // Create test user 1
    user1 = await prisma.user.create({
      data: {
        name: "Chef Alpha",
        email: `chef-alpha-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: "hashedPassword123!",
        isActive: true,
      },
    });
    user1Token = generateAccessToken(user1.id);

    // Create test user 2 (for authorization tests)
    user2 = await prisma.user.create({
      data: {
        name: "Chef Beta",
        email: `chef-beta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: "hashedPassword123!",
        isActive: true,
      },
    });
    user2Token = generateAccessToken(user2.id);
  });

  afterAll(async () => {
    if (user1?.id) {
      await prisma.user.delete({ where: { id: user1.id } }).catch(() => {});
    }
    if (user2?.id) {
      await prisma.user.delete({ where: { id: user2.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  let createdRecipeId;
  let ingredientAId;
  let ingredientBId;

  // ── 1. Atomic Recipe Creation ─────────────────────────────────
  it("1. creates recipe with ingredients and nutrition atomically in one transaction", async () => {
    const res = await supertest(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        title: "Mediterranean Pasta",
        description: "Fresh pasta with olives and cherry tomatoes",
        instructions: "Boil water.\nCook pasta.\nToss with olive oil and toppings.",
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        ingredients: [
          { name: "Penne Pasta", quantity: 200, unit: "g" },
          { name: "Kalamata Olives", quantity: 50, unit: "g" },
        ],
        nutrition: {
          calories: 450,
          protein: 14,
          carbohydrates: 70,
          fat: 12,
          fiber: 4,
          sugar: 3,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const recipe = res.body.data.recipe;
    expect(recipe.id).toBeDefined();
    expect(recipe.title).toBe("Mediterranean Pasta");
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.nutrition).toBeDefined();
    expect(recipe.nutrition.calories).toBe(450);

    createdRecipeId = recipe.id;
    ingredientAId = recipe.ingredients.find((i) => i.name === "Penne Pasta").id;
    ingredientBId = recipe.ingredients.find((i) => i.name === "Kalamata Olives").id;

    // Verify in real PostgreSQL database
    const dbRecipe = await prisma.recipe.findUnique({
      where: { id: createdRecipeId },
      include: { ingredients: true, nutrition: true },
    });
    expect(dbRecipe).not.toBeNull();
    expect(dbRecipe.ingredients).toHaveLength(2);
    expect(dbRecipe.nutrition.protein).toBe(14);
  });

  // ── 2. Updating Existing Nutrition via PATCH ──────────────────
  it("2. updates existing nutrition using PATCH and prevents duplicate creation with 409", async () => {
    // Update existing nutrition via PATCH
    const patchRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}/nutrition`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        calories: 480,
        protein: 16,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.nutrition.calories).toBe(480);
    expect(patchRes.body.data.nutrition.protein).toBe(16);

    // Verify duplicate POST creates 409 RECIPE_NUTRITION_EXISTS instead of P2002 error
    const duplicateRes = await supertest(app)
      .post(`/api/v1/recipes/${createdRecipeId}/nutrition`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        calories: 500,
        protein: 20,
        carbohydrates: 60,
        fat: 10,
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe("RECIPE_NUTRITION_EXISTS");
  });

  // ── 3. Adding a New Ingredient ─────────────────────────────────
  it("3. adds a new ingredient during atomic recipe update", async () => {
    const updateRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        ingredients: [
          { id: ingredientAId, name: "Penne Pasta", quantity: 200, unit: "g" },
          { id: ingredientBId, name: "Kalamata Olives", quantity: 50, unit: "g" },
          { name: "Extra Virgin Olive Oil", quantity: 2, unit: "tbsp" },
        ],
      });

    expect(updateRes.status).toBe(200);
    const ingredients = updateRes.body.data.recipe.ingredients;
    expect(ingredients).toHaveLength(3);
    const newIng = ingredients.find((i) => i.name === "Extra Virgin Olive Oil");
    expect(newIng).toBeDefined();
    expect(newIng.id).toBeDefined();
    expect(newIng.quantity).toBe(2);
    expect(newIng.unit).toBe("tbsp");
  });

  // ── 4. Editing Ingredient Quantities and Units ─────────────────
  it("4. edits ingredient quantities and units while preserving ID", async () => {
    const updateRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        ingredients: [
          { id: ingredientAId, name: "Whole Wheat Penne", quantity: 250, unit: "grams" },
          { id: ingredientBId, name: "Kalamata Olives", quantity: 50, unit: "g" },
        ],
      });

    expect(updateRes.status).toBe(200);
    const ingredients = updateRes.body.data.recipe.ingredients;
    const modifiedIng = ingredients.find((i) => i.id === ingredientAId);
    expect(modifiedIng.name).toBe("Whole Wheat Penne");
    expect(modifiedIng.quantity).toBe(250);
    expect(modifiedIng.unit).toBe("grams");
  });

  // ── 5. Removing an Ingredient ──────────────────────────────────
  it("5. removes an ingredient omitted from the payload", async () => {
    const updateRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        ingredients: [
          { id: ingredientAId, name: "Whole Wheat Penne", quantity: 250, unit: "grams" },
          // ingredientBId (olives) is omitted -> should be deleted
        ],
      });

    expect(updateRes.status).toBe(200);
    const ingredients = updateRes.body.data.recipe.ingredients;
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].id).toBe(ingredientAId);

    // Verify in PostgreSQL that ingredientB was deleted
    const dbB = await prisma.recipeIngredient.findUnique({
      where: { id: ingredientBId },
    });
    expect(dbB).toBeNull();
  });

  // ── 6. Preserving Unchanged Ingredients and IDs ────────────────
  it("6. preserves unchanged ingredients and their IDs without recreation", async () => {
    const beforeDb = await prisma.recipeIngredient.findUnique({
      where: { id: ingredientAId },
    });

    const updateRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        title: "Updated Mediterranean Pasta Title",
        ingredients: [
          { id: ingredientAId, name: "Whole Wheat Penne", quantity: 250, unit: "grams" },
        ],
      });

    expect(updateRes.status).toBe(200);
    const afterDb = await prisma.recipeIngredient.findUnique({
      where: { id: ingredientAId },
    });

    expect(afterDb.id).toBe(beforeDb.id);
    expect(new Date(afterDb.createdAt).toISOString()).toBe(new Date(beforeDb.createdAt).toISOString());
  });

  // ── 7. Handling Zero Nutrition Values ─────────────────────────
  it("7. preserves legitimate zero nutrition values on update", async () => {
    const zeroRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}/nutrition`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        calories: 0,
        fat: 0,
        sugar: 0,
      });

    expect(zeroRes.status).toBe(200);
    expect(zeroRes.body.data.nutrition.calories).toBe(0);
    expect(zeroRes.body.data.nutrition.fat).toBe(0);
    expect(zeroRes.body.data.nutrition.sugar).toBe(0);

    // Verify in PostgreSQL
    const dbNutrition = await prisma.recipeNutrition.findUnique({
      where: { recipeId: createdRecipeId },
    });
    expect(dbNutrition.calories).toBe(0);
    expect(dbNutrition.fat).toBe(0);
    expect(dbNutrition.sugar).toBe(0);
  });

  // ── 8. Preventing Cross-User Modifications ─────────────────────
  it("8. prevents cross-user recipe, ingredient, and nutrition modifications", async () => {
    // User 2 cannot update User 1's recipe
    const updateRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ title: "Hacked Title" });
    expect(updateRes.status).toBe(404);

    // User 2 cannot update User 1's nutrition
    const nutritionRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}/nutrition`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ calories: 9999 });
    expect(nutritionRes.status).toBe(404);

    // User 2 cannot hijack User 1's ingredient ID in their own recipe
    const user2Recipe = await prisma.recipe.create({
      data: {
        userId: user2.id,
        title: "Chef Beta Soup",
        instructions: "Cook soup",
      },
    });

    const hijackRes = await supertest(app)
      .patch(`/api/v1/recipes/${user2Recipe.id}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({
        ingredients: [
          { id: ingredientAId, name: "Stolen Pasta", quantity: 100, unit: "g" },
        ],
      });

    expect(hijackRes.status).toBe(400);
    expect(hijackRes.body.error.code).toBe("INVALID_INGREDIENT_ID");

    // Clean up user2Recipe
    await prisma.recipe.delete({ where: { id: user2Recipe.id } });
  });

  // ── 9. Rolling Back Failed Atomic Mutations ────────────────────
  it("9. rolls back entire transaction if any part of atomic update fails", async () => {
    const beforeRecipe = await prisma.recipe.findUnique({
      where: { id: createdRecipeId },
      include: { ingredients: true, nutrition: true },
    });

    // Attempt update with valid title change BUT invalid ingredient quantity (-10)
    const failRes = await supertest(app)
      .patch(`/api/v1/recipes/${createdRecipeId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        title: "This Title Should Not Persist",
        ingredients: [
          { id: ingredientAId, name: "Whole Wheat Penne", quantity: -10, unit: "grams" },
        ],
      });

    expect(failRes.status).toBe(400);

    // Verify in PostgreSQL that title was NOT changed
    const afterRecipe = await prisma.recipe.findUnique({
      where: { id: createdRecipeId },
    });
    expect(afterRecipe.title).toBe(beforeRecipe.title);
  });

  // ── 10. Reload and PostgreSQL Persistence ──────────────────────
  it("10. reloads recipe and verifies complete PostgreSQL persistence", async () => {
    const getRes = await supertest(app)
      .get(`/api/v1/recipes/${createdRecipeId}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(getRes.status).toBe(200);
    const r = getRes.body.data.recipe;
    expect(r.id).toBe(createdRecipeId);
    expect(r.ingredients).toHaveLength(1);
    expect(r.ingredients[0].id).toBe(ingredientAId);
    expect(r.nutrition).toBeDefined();
    expect(r.nutrition.calories).toBe(0);
  });
});
