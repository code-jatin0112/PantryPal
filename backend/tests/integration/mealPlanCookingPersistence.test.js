import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { randomUUID } from "crypto";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { generateAccessToken } from "../../src/utils/token.js";

describe("Meal Planning & Cooking Mode Integration Persistence Tests (Phase 4)", () => {
  let user1;
  let user1Token;
  let user2;
  let user2Token;

  let recipe1;
  let recipe2;
  let user1Pantry;
  let user2Pantry;

  beforeAll(async () => {
    // Safety guard
    const dbUrl = process.env.DATABASE_URL || "";
    const isProduction =
      process.env.NODE_ENV === "production" ||
      /(prod|production|supabase\.co|neon\.tech|railway\.app|aws\.com)/i.test(dbUrl);

    if (isProduction) {
      throw new Error("CRITICAL SAFETY GUARD: Refusing to run tests against a production database!");
    }

    // Create User 1
    user1 = await prisma.user.create({
      data: {
        name: "Chef Alpha MealPlan",
        email: `chef-alpha-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: "hashedPassword123!",
        isActive: true,
      },
    });
    user1Token = generateAccessToken(user1.id);

    // Create User 2
    user2 = await prisma.user.create({
      data: {
        name: "Chef Beta MealPlan",
        email: `chef-beta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: "hashedPassword123!",
        isActive: true,
      },
    });
    user2Token = generateAccessToken(user2.id);

    // Create User 1 Pantry
    user1Pantry = await prisma.pantry.create({
      data: {
        userId: user1.id,
        name: "Alpha Kitchen Pantry",
      },
    });

    // Create User 2 Pantry
    user2Pantry = await prisma.pantry.create({
      data: {
        userId: user2.id,
        name: "Beta Kitchen Pantry",
      },
    });

    // Create User 1 Recipes
    recipe1 = await prisma.recipe.create({
      data: {
        userId: user1.id,
        title: "Tuscan Garlic Penne",
        description: "Classic Italian pasta dish",
        instructions: "Step 1: Boil salted water.\nStep 2: Cook penne for 10 minutes.\nStep 3: Toss with garlic oil.",
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        ingredients: {
          create: [
            { name: "Penne Pasta", quantity: 200, unit: "g" },
            { name: "Garlic Cloves", quantity: 4, unit: "pcs" },
          ],
        },
      },
      include: {
        ingredients: true,
      },
    });

    recipe2 = await prisma.recipe.create({
      data: {
        userId: user1.id,
        title: "Greek Lemon Chicken",
        description: "Herb-marinated chicken breast",
        instructions: "Step 1: Marinate chicken in lemon juice.\nStep 2: Grill chicken until golden.",
        prepTime: 15,
        cookTime: 20,
        servings: 2,
        ingredients: {
          create: [
            { name: "Chicken Breast", quantity: 300, unit: "g" },
            { name: "Olive Oil", quantity: 30, unit: "ml" },
          ],
        },
      },
      include: {
        ingredients: true,
      },
    });
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

  let createdMealPlanId;
  let firstDishId;
  let secondDishId;

  // ── 1. Create Meal Plan with dishes ───────────────────────────
  it("1. creates meal plan with scheduled dishes and returns both items and dishes", async () => {
    const today = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await supertest(app)
      .post("/api/v1/meal-plans")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        name: "Weekly Gourmet Plan",
        startDate: today,
        endDate: nextWeek,
        peopleCount: 4,
        budget: 500,
        dishes: [
          {
            recipeId: recipe1.id,
            plannedDate: today,
            mealType: "Dinner",
            requestedServings: 4,
            cuisine: "Italian",
            budgetPriority: "medium",
          },
          {
            recipeId: recipe2.id,
            plannedDate: nextWeek,
            mealType: "Lunch",
            requestedServings: 4,
            cuisine: "Greek",
            budgetPriority: "high",
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const plan = res.body.data.mealPlan;
    expect(plan.id).toBeDefined();
    expect(plan.name).toBe("Weekly Gourmet Plan");
    // Verify both items and dishes aliases are populated
    expect(Array.isArray(plan.items)).toBe(true);
    expect(Array.isArray(plan.dishes)).toBe(true);
    expect(plan.items.length).toBe(2);
    expect(plan.dishes.length).toBe(2);

    createdMealPlanId = plan.id;
    firstDishId = plan.dishes[0].id;
    secondDishId = plan.dishes[1].id;
  });

  // ── 2. Fetch Meal Plan by ID ──────────────────────────────────
  it("2. fetches meal plan by ID and includes scheduled dishes with recipe details", async () => {
    const res = await supertest(app)
      .get(`/api/v1/meal-plans/${createdMealPlanId}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const plan = res.body.data.mealPlan;
    expect(plan.id).toBe(createdMealPlanId);
    expect(plan.dishes).toHaveLength(2);
    expect(plan.dishes[0].recipe).toBeDefined();
    expect(plan.dishes[0].recipe.title).toBeDefined();
    expect(plan.items).toHaveLength(2);
  });

  // ── 3. Update Meal Plan with atomic dish CRUD ──────────────────
  it("3. updates meal plan: updates dish 1, deletes dish 2, adds dish 3 atomically", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await supertest(app)
      .patch(`/api/v1/meal-plans/${createdMealPlanId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        name: "Updated Gourmet Plan",
        startDate: tomorrow,
        endDate: nextWeek,
        peopleCount: 3,
        dishes: [
          // Update existing dish 1 (servings from 4 -> 6)
          {
            id: firstDishId,
            recipeId: recipe1.id,
            plannedDate: tomorrow,
            mealType: "Dinner",
            requestedServings: 6,
            cuisine: "Italian",
            budgetPriority: "high",
          },
          // New dish (re-adding recipe 2 as Dinner)
          {
            recipeId: recipe2.id,
            plannedDate: tomorrow,
            mealType: "Dinner",
            requestedServings: 3,
            cuisine: "Greek",
            budgetPriority: "medium",
          },
          // Note: secondDishId is omitted, so it must be deleted atomically
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedPlan = res.body.data.mealPlan;
    expect(updatedPlan.name).toBe("Updated Gourmet Plan");
    expect(updatedPlan.peopleCount).toBe(3);
    expect(updatedPlan.dishes).toHaveLength(2);

    // Verify firstDishId was updated
    const updatedDish1 = updatedPlan.dishes.find((d) => d.id === firstDishId);
    expect(updatedDish1).toBeDefined();
    expect(updatedDish1.requestedServings).toBe(6);

    // Verify secondDishId was deleted
    const deletedDish = updatedPlan.dishes.find((d) => d.id === secondDishId);
    expect(deletedDish).toBeUndefined();

    // Verify in database directly
    const dbItems = await prisma.mealPlanItem.findMany({
      where: { mealPlanId: createdMealPlanId },
    });
    expect(dbItems).toHaveLength(2);
  });

  // ── 4. Grocery Requirements Evaluation ─────────────────────────
  it("4. evaluates grocery requirements accurately against available pantry stock", async () => {
    // Add 100g Penne Pasta to pantry
    // Dish 1 requires recipe 1 for 6 servings. Base recipe is 2 servings with 200g penne.
    // Scaled required: 200 * (6 / 2) = 600g penne.
    // Pantry has 100g penne -> missing: 500g penne.
    await prisma.pantryItem.create({
      data: {
        pantryId: user1Pantry.id,
        name: "Penne Pasta",
        quantity: 100,
        unit: "g",
        category: "Grains & Pasta",
      },
    });

    const res = await supertest(app)
      .post(`/api/v1/meal-plans/${createdMealPlanId}/grocery-requirements`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const requirements = res.body.data;
    const items = requirements.missingItems || requirements.items || [];
    expect(items.length).toBeGreaterThan(0);

    const penneMissing = items.find((i) => i.name?.toLowerCase().includes("penne"));
    expect(penneMissing).toBeDefined();
    const missingQty = penneMissing.missingQuantity ?? penneMissing.quantity;
    expect(missingQty).toBe(500);
  });

  // ── 5. Start Cooking Session with Servings ──────────────────────
  let activeCookingSessionId;

  it("5. starts a cooking session for a recipe with custom servings", async () => {
    const res = await supertest(app)
      .post(`/api/v1/recipes/${recipe1.id}/cooking-sessions`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ servings: 4 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const session = res.body.data.session;
    expect(session.id).toBeDefined();
    expect(session.recipeId).toBe(recipe1.id);
    expect(session.servings).toBe(4);
    expect(session.status).toBe("active");
    expect(session.currentStep).toBe(1);

    activeCookingSessionId = session.id;
  });

  // ── 6. Resume Cooking Session via active endpoint ──────────────
  it("6. resumes active cooking session via GET /recipes/:recipeId/cooking-sessions/active", async () => {
    const res = await supertest(app)
      .get(`/api/v1/recipes/${recipe1.id}/cooking-sessions/active`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const session = res.body.data.session;
    expect(session.id).toBe(activeCookingSessionId);
    expect(session.status).toBe("active");
  });

  // ── 7. Update Cooking Progress (1-based index) ─────────────────
  it("7. updates cooking progress with 1-based currentStep and validates input", async () => {
    // Valid update to step 2
    const res = await supertest(app)
      .patch(`/api/v1/cooking-sessions/${activeCookingSessionId}/progress`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ currentStep: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.currentStep).toBe(2);

    // Invalid step 0 should be rejected by validator
    const invalidRes = await supertest(app)
      .patch(`/api/v1/cooking-sessions/${activeCookingSessionId}/progress`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ currentStep: 0 });

    expect(invalidRes.status).toBe(400);
  });

  // ── 8. Complete Cooking Session with Pantry Deduction ───────────
  it("8. completes cooking session and accurately deducts scaled ingredients from pantry", async () => {
    // Recipe 1 has 200g penne and 4 cloves garlic for 2 servings.
    // Active session has 4 servings (scaling factor = 4/2 = 2).
    // Scaled required: 400g penne, 8 cloves garlic.
    // Update pantry item: Penne = 1000g, Garlic = 20 pcs
    await prisma.pantryItem.updateMany({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
      data: { quantity: 1000 },
    });

    await prisma.pantryItem.create({
      data: {
        pantryId: user1Pantry.id,
        name: "Garlic Cloves",
        quantity: 20,
        unit: "pcs",
        category: "Produce",
      },
    });

    const res = await supertest(app)
      .post(`/api/v1/cooking-sessions/${activeCookingSessionId}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { session, consumed, items } = res.body.data;
    expect(session.status).toBe("completed");

    // Check Penne deduction: 1000 - 400 = 600g
    const penneItem = items.find((i) => i.name === "Penne Pasta");
    expect(penneItem).toBeDefined();
    expect(penneItem.quantity).toBe(600);

    // Check Garlic deduction: 20 - 8 = 12 pcs
    const garlicItem = items.find((i) => i.name === "Garlic Cloves");
    expect(garlicItem).toBeDefined();
    expect(garlicItem.quantity).toBe(12);

    // Verify directly in database
    const dbPenne = await prisma.pantryItem.findFirst({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
    });
    expect(dbPenne.quantity).toBe(600);
  });

  // ── 9. Prevent Duplicate Session Completion ─────────────────────
  it("9. prevents duplicate session completion with 409 conflict and preserves stock", async () => {
    const res = await supertest(app)
      .post(`/api/v1/cooking-sessions/${activeCookingSessionId}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);

    // Verify stock remains untouched at 600g
    const dbPenne = await prisma.pantryItem.findFirst({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
    });
    expect(dbPenne.quantity).toBe(600);
  });

  // ── 10. Insufficient Pantry Stock Handling ─────────────────────
  it("10. rejects session completion on insufficient stock with 400 without modifying inventory", async () => {
    // Start a new session for Recipe 2 (Chicken Breast 300g, Olive Oil 30ml for 2 servings)
    const sessionRes = await supertest(app)
      .post(`/api/v1/recipes/${recipe2.id}/cooking-sessions`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ servings: 2 });

    expect(sessionRes.status).toBe(201);
    const newSessionId = sessionRes.body.data.session.id;

    // Add Olive Oil (100ml) but Chicken Breast is only 100g (needs 300g)
    await prisma.pantryItem.create({
      data: {
        pantryId: user1Pantry.id,
        name: "Chicken Breast",
        quantity: 100,
        unit: "g",
        category: "Meat & Seafood",
      },
    });

    await prisma.pantryItem.create({
      data: {
        pantryId: user1Pantry.id,
        name: "Olive Oil",
        quantity: 100,
        unit: "ml",
        category: "Oils & Vinegars",
      },
    });

    const completeRes = await supertest(app)
      .post(`/api/v1/cooking-sessions/${newSessionId}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });

    expect(completeRes.status).toBe(400);
    expect(completeRes.body.success).toBe(false);

    // Verify stock was NOT deducted
    const chickenItem = await prisma.pantryItem.findFirst({
      where: { pantryId: user1Pantry.id, name: "Chicken Breast" },
    });
    expect(chickenItem.quantity).toBe(100);

    const oilItem = await prisma.pantryItem.findFirst({
      where: { pantryId: user1Pantry.id, name: "Olive Oil" },
    });
    expect(oilItem.quantity).toBe(100);

    // Verify session is still active
    const sessionInDb = await prisma.cookingSession.findUnique({
      where: { id: newSessionId },
    });
    expect(sessionInDb.status).toBe("active");
  });

  // ── 11. Concurrency Protection on Completion ───────────────────
  it("11. prevents concurrent double completion: only one transaction commits, other fails with 409", async () => {
    // Setup recipe 1 with plenty of stock
    await prisma.pantryItem.updateMany({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
      data: { quantity: 1000 },
    });

    // Create a new session directly for testing concurrency
    const concSession = await prisma.cookingSession.create({
      data: {
        userId: user1.id,
        recipeId: recipe1.id,
        servings: 2, // requires 200g penne
        status: "active",
        currentStep: 1,
        totalSteps: 3,
      },
    });

    // Fire two concurrent completion calls
    const [resA, resB] = await Promise.all([
      supertest(app)
        .post(`/api/v1/cooking-sessions/${concSession.id}/complete`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ pantryId: user1Pantry.id }),
      supertest(app)
        .post(`/api/v1/cooking-sessions/${concSession.id}/complete`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ pantryId: user1Pantry.id }),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // Stock must have been deducted exactly once (1000 - 200 = 800)
    const penneInDb = await prisma.pantryItem.findFirst({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
    });
    expect(penneInDb.quantity).toBe(800);
  });

  // ── 12. Cross-User Authorization & Isolation ───────────────────
  it("12. enforces strict cross-user access boundaries for meal plans and cooking sessions", async () => {
    // User 2 cannot access or resume User 1's active cooking session
    const resumeRes = await supertest(app)
      .get(`/api/v1/recipes/${recipe1.id}/cooking-sessions/active`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect([403, 404]).toContain(resumeRes.status);

    // User 2 cannot complete User 1's cooking session
    const completeRes = await supertest(app)
      .post(`/api/v1/cooking-sessions/${activeCookingSessionId}/complete`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ pantryId: user2Pantry.id });

    expect([403, 404]).toContain(completeRes.status);

    // User 1 cannot use User 2's pantry for deduction
    const user1NewSession = await prisma.cookingSession.create({
      data: {
        userId: user1.id,
        recipeId: recipe1.id,
        servings: 2,
        status: "active",
        currentStep: 1,
        totalSteps: 3,
      },
    });

    const crossPantryRes = await supertest(app)
      .post(`/api/v1/cooking-sessions/${user1NewSession.id}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user2Pantry.id });

    expect([403, 404]).toContain(crossPantryRes.status);

    // User 2 cannot update User 1's meal plan
    const updatePlanRes = await supertest(app)
      .patch(`/api/v1/meal-plans/${createdMealPlanId}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ name: "Hacked Plan" });

    expect([403, 404]).toContain(updatePlanRes.status);
  });

  // ── 13. Dish ID Validation & Transaction Rollback ──────────────
  it("13. rejects update with unfamiliar dish ID with 400 and rolls back earlier mutations", async () => {
    const foreignDishId = randomUUID();
    const originalPlan = await prisma.mealPlan.findUnique({
      where: { id: createdMealPlanId },
    });

    const res = await supertest(app)
      .patch(`/api/v1/meal-plans/${createdMealPlanId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        name: "This Name Must Rollback",
        dishes: [
          {
            id: foreignDishId,
            recipeId: recipe1.id,
            requestedServings: 2,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_MEAL_PLAN_DISH_ID");

    // Verify rollback: name did NOT change in database
    const dbPlan = await prisma.mealPlan.findUnique({
      where: { id: createdMealPlanId },
    });
    expect(dbPlan.name).toBe(originalPlan.name);
  });

  // ── 14. Empty Dish Array & New Dish ID Omission ─────────────────
  it("14. preserves genuine empty dish array updates and creates new dishes when ID is omitted", async () => {
    // 1. Update to empty array
    const emptyRes = await supertest(app)
      .patch(`/api/v1/meal-plans/${createdMealPlanId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        dishes: [],
      });

    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.mealPlan.dishes).toHaveLength(0);

    const dbEmptyItems = await prisma.mealPlanItem.findMany({
      where: { mealPlanId: createdMealPlanId },
    });
    expect(dbEmptyItems).toHaveLength(0);

    // 2. Add brand new dish omitting ID
    const addRes = await supertest(app)
      .patch(`/api/v1/meal-plans/${createdMealPlanId}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        dishes: [
          {
            recipeId: recipe1.id,
            mealType: "Dinner",
            requestedServings: 2,
          },
        ],
      });

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.mealPlan.dishes).toHaveLength(1);
    expect(addRes.body.data.mealPlan.dishes[0].id).toBeDefined();

    const dbNewItems = await prisma.mealPlanItem.findMany({
      where: { mealPlanId: createdMealPlanId },
    });
    expect(dbNewItems).toHaveLength(1);
  });

  // ── 15. Cook Again Lifecycle & Second Session Deduction ───────────
  it("15. Cook Again creates a different session ID and accurately deducts stock on second completion", async () => {
    // 0. Ensure no active sessions linger for recipe1 before testing fresh start & Cook Again
    await prisma.cookingSession.updateMany({
      where: { userId: user1.id, recipeId: recipe1.id, status: "active" },
      data: { status: "completed" },
    });

    // 1. Ensure stock is available for 2 runs (requires 200g per run for 2 servings of recipe1)
    await prisma.pantryItem.updateMany({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
      data: { quantity: 1000 },
    });

    // 2. Start session 1
    const start1Res = await supertest(app)
      .post(`/api/v1/recipes/${recipe1.id}/cooking-sessions`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ servings: 2 });
    expect(start1Res.status).toBe(201);
    const session1Id = start1Res.body.data.session.id;

    // 3. Complete session 1 -> stock deducted once (1000 - 200 = 800)
    const comp1Res = await supertest(app)
      .post(`/api/v1/cooking-sessions/${session1Id}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });
    expect(comp1Res.status).toBe(200);

    const stockAfter1 = await prisma.pantryItem.findFirst({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
    });
    expect(stockAfter1.quantity).toBe(800);

    // 4. Duplicate completion on session 1 remains rejected (409)
    const dupCompRes = await supertest(app)
      .post(`/api/v1/cooking-sessions/${session1Id}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });
    expect(dupCompRes.status).toBe(409);

    // 5. Cook Again: start session 2 for the same recipe
    const start2Res = await supertest(app)
      .post(`/api/v1/recipes/${recipe1.id}/cooking-sessions`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ servings: 2 });
    expect(start2Res.status).toBe(201);
    const session2Id = start2Res.body.data.session.id;

    // Verify session 2 has a genuinely different ID
    expect(session2Id).not.toBe(session1Id);

    // 6. Complete session 2 -> stock deducted exactly once more (800 - 200 = 600)
    const comp2Res = await supertest(app)
      .post(`/api/v1/cooking-sessions/${session2Id}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });
    expect(comp2Res.status).toBe(200);

    const stockAfter2 = await prisma.pantryItem.findFirst({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
    });
    expect(stockAfter2.quantity).toBe(600);

    // 7. Progress update on completed session 2 is rejected (409)
    const progRes = await supertest(app)
      .patch(`/api/v1/cooking-sessions/${session2Id}/progress`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ currentStep: 2 });
    expect(progRes.status).toBe(409);
  });

  // ── 16. Ordered Writes, Backward Navigation & Post-Completion Lock ─
  it("16. reliably persists intentional backward navigation and rejects progress updates after session completion", async () => {
    // 1. Start a fresh active session
    await prisma.cookingSession.updateMany({
      where: { userId: user1.id, recipeId: recipe1.id, status: "active" },
      data: { status: "completed" },
    });

    await prisma.pantryItem.updateMany({
      where: { pantryId: user1Pantry.id, name: "Penne Pasta" },
      data: { quantity: 1000 },
    });
    await prisma.pantryItem.updateMany({
      where: { pantryId: user1Pantry.id, name: "Garlic Cloves" },
      data: { quantity: 50 },
    });

    const startRes = await supertest(app)
      .post(`/api/v1/recipes/${recipe1.id}/cooking-sessions`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ servings: 2 });
    expect(startRes.status).toBe(201);
    const sessionId = startRes.body.data.session.id;

    // 2. Advance forward: Step 1 -> Step 2
    const step2Res = await supertest(app)
      .patch(`/api/v1/cooking-sessions/${sessionId}/progress`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ currentStep: 2 });
    expect(step2Res.status).toBe(200);

    // 3. Advance forward: Step 2 -> Step 3
    const step3Res = await supertest(app)
      .patch(`/api/v1/cooking-sessions/${sessionId}/progress`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ currentStep: 3 });
    expect(step3Res.status).toBe(200);

    // 4. Intentional backward navigation: Step 3 -> Step 2
    const backRes = await supertest(app)
      .patch(`/api/v1/cooking-sessions/${sessionId}/progress`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ currentStep: 2 });
    expect(backRes.status).toBe(200);

    // 5. Verify database confirms the backward step (2)
    const dbSession = await prisma.cookingSession.findUnique({
      where: { id: sessionId },
    });
    expect(dbSession.currentStep).toBe(2);

    // 6. Complete session
    const compRes = await supertest(app)
      .post(`/api/v1/cooking-sessions/${sessionId}/complete`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ pantryId: user1Pantry.id });
    expect(compRes.status).toBe(200);

    // 7. In-flight / late progress update arriving after completion must be rejected (409)
    const lateProgressRes = await supertest(app)
      .patch(`/api/v1/cooking-sessions/${sessionId}/progress`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ currentStep: 1 });
    expect(lateProgressRes.status).toBe(409);
    expect(lateProgressRes.body.error.code).toBe("COOKING_SESSION_COMPLETED");

    // 8. Completed status and final step are untouched
    const finalizedDbSession = await prisma.cookingSession.findUnique({
      where: { id: sessionId },
    });
    expect(finalizedDbSession.status).toBe("completed");
    expect(finalizedDbSession.currentStep).toBe(recipe1.instructions.split("\n").filter(Boolean).length || 3);
  });
});
