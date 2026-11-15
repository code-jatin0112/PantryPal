import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { hashPassword, comparePassword } from "../../src/utils/password.js";

describe("Account Management & Security Integration Tests (Phase 5)", () => {
  let primaryUser;
  let primaryToken;
  let secondaryUser;
  let secondaryToken;

  beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL || "";
    const isProduction =
      process.env.NODE_ENV === "production" ||
      /(prod|production|supabase\.co|neon\.tech|railway\.app|aws\.com)/i.test(dbUrl);

    if (isProduction) {
      throw new Error(
        "CRITICAL SAFETY GUARD: Refusing to run tests against a production database!"
      );
    }

    const initialHashedPassword = await hashPassword("InitialSecret123!");

    // Primary test user
    primaryUser = await prisma.user.create({
      data: {
        name: "Chef Gordon",
        email: `gordon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@pantrypal.test`,
        password: initialHashedPassword,
        isActive: true,
      },
    });
    primaryToken = generateAccessToken(primaryUser.id);

    // Secondary test user for cross-user authorization tests
    secondaryUser = await prisma.user.create({
      data: {
        name: "Chef Julia",
        email: `julia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@pantrypal.test`,
        password: initialHashedPassword,
        isActive: true,
      },
    });
    secondaryToken = generateAccessToken(secondaryUser.id);
  });

  afterAll(async () => {
    if (primaryUser?.id) {
      await prisma.user.deleteMany({ where: { id: primaryUser.id } });
    }
    if (secondaryUser?.id) {
      await prisma.user.deleteMany({ where: { id: secondaryUser.id } });
    }
  });

  // ── 1. Profile Read & Authentication Guards ─────────────────
  describe("1. Profile Retrieval & Authentication Guards", () => {
    it("successfully retrieves authenticated profile via GET /api/v1/auth/me", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${primaryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(primaryUser.id);
      expect(res.body.data.user.name).toBe("Chef Gordon");
      expect(res.body.data.user.email).toBe(primaryUser.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("successfully retrieves authenticated profile via GET /api/v1/auth/profile alias", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${primaryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(primaryUser.id);
    });

    it("rejects request with 401 when Authorization header is absent", async () => {
      const res = await supertest(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("rejects request with 401 on invalid/expired token", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-or-expired-token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  // ── 2. Profile Update & Input Validation ────────────────────
  describe("2. Profile Persistence & Email Uniqueness", () => {
    it("updates authenticated user profile name and persists to PostgreSQL", async () => {
      const res = await supertest(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({ name: "Chef Gordon Ramsay" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe("Chef Gordon Ramsay");

      // Verify directly from PostgreSQL
      const dbUser = await prisma.user.findUnique({
        where: { id: primaryUser.id },
      });
      expect(dbUser.name).toBe("Chef Gordon Ramsay");
    });

    it("updates email when new email is not in use", async () => {
      const newEmail = `gordon-updated-${Date.now()}@pantrypal.test`;
      const res = await supertest(app)
        .patch("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({ email: newEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(newEmail);

      const dbUser = await prisma.user.findUnique({
        where: { id: primaryUser.id },
      });
      expect(dbUser.email).toBe(newEmail);
      primaryUser.email = newEmail;
    });

    it("rejects duplicate email with 409 EMAIL_ALREADY_EXISTS", async () => {
      const res = await supertest(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({ email: secondaryUser.email });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("rejects invalid email format with 400 VALIDATION_ERROR", async () => {
      const res = await supertest(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({ email: "invalid-email-format" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("ignores frontend-supplied userId and scopes strictly to authenticated user", async () => {
      const res = await supertest(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({
          userId: secondaryUser.id,
          name: "Attacking Name",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(primaryUser.id);
      expect(res.body.data.user.name).toBe("Attacking Name");

      // Verify secondary user remains untouched
      const secDb = await prisma.user.findUnique({
        where: { id: secondaryUser.id },
      });
      expect(secDb.name).toBe("Chef Julia");
    });
  });

  // ── 3. Secure Password Change ───────────────────────────────
  describe("3. Secure Password Change & Verification", () => {
    it("successfully changes password when current password matches", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({
          currentPassword: "InitialSecret123!",
          newPassword: "BrandNewSecurePassword456!",
          confirmPassword: "BrandNewSecurePassword456!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify password was updated in DB and matches new hash
      const dbUser = await prisma.user.findUnique({
        where: { id: primaryUser.id },
      });
      const matches = await comparePassword(
        "BrandNewSecurePassword456!",
        dbUser.password
      );
      expect(matches).toBe(true);

      // Verify old password no longer matches
      const oldMatches = await comparePassword(
        "InitialSecret123!",
        dbUser.password
      );
      expect(oldMatches).toBe(false);
    });

    it("rejects password change when current password is wrong with 400 INVALID_CURRENT_PASSWORD", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({
          currentPassword: "WrongPassword999!",
          newPassword: "AnotherNewPassword789!",
          confirmPassword: "AnotherNewPassword789!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CURRENT_PASSWORD");
    });

    it("rejects password change when new password equals current password", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({
          currentPassword: "BrandNewSecurePassword456!",
          newPassword: "BrandNewSecurePassword456!",
          confirmPassword: "BrandNewSecurePassword456!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects password change when confirmPassword does not match", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({
          currentPassword: "BrandNewSecurePassword456!",
          newPassword: "AnotherValidPassword789!",
          confirmPassword: "MismatchPassword!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── 4. Personal Data Export ─────────────────────────────────
  describe("4. Personal Data Export & Privacy", () => {
    beforeAll(async () => {
      // Create test pantry, recipe, shopping item, preference for export testing
      await prisma.userPreference.upsert({
        where: { userId: primaryUser.id },
        update: { dietaryPreferences: ["Vegetarian", "High-Protein"] },
        create: {
          userId: primaryUser.id,
          dietaryPreferences: ["Vegetarian", "High-Protein"],
          defaultServings: 4,
        },
      });

      const pantry = await prisma.pantry.create({
        data: {
          name: "Gordon's Master Pantry",
          userId: primaryUser.id,
        },
      });

      await prisma.pantryItem.create({
        data: {
          pantryId: pantry.id,
          name: "Organic Olive Oil",
          quantity: 2,
          unit: "bottles",
        },
      });

      const recipe = await prisma.recipe.create({
        data: {
          title: "Risotto Milanese",
          instructions: "Stir constantly with warm stock.",
          userId: primaryUser.id,
        },
      });

      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          name: "Arborio Rice",
          quantity: 250,
          unit: "g",
        },
      });

      await prisma.shoppingListItem.create({
        data: {
          userId: primaryUser.id,
          name: "Saffron Threads",
          quantity: 1,
          unit: "g",
        },
      });
    });

    it("exports complete structured user data archive excluding password hash", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/export")
        .set("Authorization", `Bearer ${primaryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const archive = res.body.data;
      expect(archive.exportedAt).toBeDefined();
      expect(archive.version).toBe("1.0.0");

      // Verify Account
      expect(archive.account.id).toBe(primaryUser.id);
      expect(archive.account.email).toBe(primaryUser.email);
      expect(archive.account.password).toBeUndefined(); // NEVER EXPOSE PASSWORD

      // Verify Preferences
      expect(archive.preferences.dietaryPreferences).toContain("Vegetarian");
      expect(archive.preferences.dietaryRequirements).toContain("Vegetarian");

      // Verify Pantries
      expect(archive.pantries.length).toBeGreaterThanOrEqual(1);
      const oliveOil = archive.pantries
        .flatMap((p) => p.items)
        .find((i) => i.name === "Organic Olive Oil");
      expect(oliveOil).toBeDefined();

      // Verify Recipes
      const risotto = archive.recipes.find((r) => r.title === "Risotto Milanese");
      expect(risotto).toBeDefined();
      expect(risotto.ingredients[0].name).toBe("Arborio Rice");

      // Verify Shopping List
      const saffron = archive.shoppingList.find((i) => i.name === "Saffron Threads");
      expect(saffron).toBeDefined();

      // Ensure secondary user data is NOT leaked into primary export
      expect(archive.account.id).not.toBe(secondaryUser.id);
    });
  });

  // ── 5. Settings Preference Contract (Task 5) ────────────────
  describe("5. Settings Preference Contract Synchronization", () => {
    it("accepts dietaryPreferences and returns both dietaryPreferences & dietaryRequirements", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({
          dietaryPreferences: ["Vegan", "Gluten-Free"],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.preferences.dietaryPreferences).toEqual([
        "Vegan",
        "Gluten-Free",
      ]);
      expect(res.body.data.preferences.dietaryRequirements).toEqual([
        "Vegan",
        "Gluten-Free",
      ]);
    });

    it("accepts dietaryRequirements for backward compatibility", async () => {
      const res = await supertest(app)
        .put("/api/v1/preferences")
        .set("Authorization", `Bearer ${primaryToken}`)
        .send({
          dietaryRequirements: ["Keto", "Dairy-Free"],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.preferences.dietaryPreferences).toEqual([
        "Keto",
        "Dairy-Free",
      ]);
      expect(res.body.data.preferences.dietaryRequirements).toEqual([
        "Keto",
        "Dairy-Free",
      ]);
    });
  });

  // ── 6. Account Deletion & Cascading Cleanup ─────────────────
  describe("6. Account Deletion & Transactional Cascade", () => {
    let doomedUser;
    let doomedToken;

    beforeAll(async () => {
      const hashedPass = await hashPassword("DeleteMe123!");
      doomedUser = await prisma.user.create({
        data: {
          name: "Doomed User",
          email: `doomed-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: true,
        },
      });
      doomedToken = generateAccessToken(doomedUser.id);

      // Seed doomed user records to verify cascading deletion
      await prisma.userPreference.create({
        data: {
          userId: doomedUser.id,
          dietaryPreferences: ["Nut-Free"],
        },
      });

      const pantry = await prisma.pantry.create({
        data: {
          name: "Doomed Pantry",
          userId: doomedUser.id,
        },
      });

      await prisma.pantryItem.create({
        data: {
          pantryId: pantry.id,
          name: "Doomed Flour",
          quantity: 1,
          unit: "kg",
        },
      });

      await prisma.recipe.create({
        data: {
          userId: doomedUser.id,
          title: "Doomed Cake",
          instructions: "Bake and delete",
        },
      });
    });

    it("rejects account deletion when password verification fails", async () => {
      const res = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${doomedToken}`)
        .send({ password: "WrongDeletePassword!" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_PASSWORD");

      // Verify user and records still exist
      const checkUser = await prisma.user.findUnique({
        where: { id: doomedUser.id },
      });
      expect(checkUser).toBeDefined();
    });

    it("successfully deletes account and cascades to all child records", async () => {
      const res = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${doomedToken}`)
        .send({ password: "DeleteMe123!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 1. Verify User deleted
      const checkUser = await prisma.user.findUnique({
        where: { id: doomedUser.id },
      });
      expect(checkUser).toBeNull();

      // 2. Verify Preferences deleted
      const checkPrefs = await prisma.userPreference.findUnique({
        where: { userId: doomedUser.id },
      });
      expect(checkPrefs).toBeNull();

      // 3. Verify Pantries and items deleted
      const checkPantries = await prisma.pantry.findMany({
        where: { userId: doomedUser.id },
      });
      expect(checkPantries.length).toBe(0);

      // 4. Verify Recipes deleted
      const checkRecipes = await prisma.recipe.findMany({
        where: { userId: doomedUser.id },
      });
      expect(checkRecipes.length).toBe(0);
    });

    it("rejects subsequent operations using the deleted user's token with 401", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${doomedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("USER_NOT_AVAILABLE");
    });
  });
});
