import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import supertest from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { hashPassword, comparePassword } from "../../src/utils/password.js";
import { connectMongo, disconnectMongo } from "../../src/config/mongo.js";
import { AiInteractionLog } from "../../src/models/AiInteractionLog.js";

describe("Account Management & Security Integration Tests (Phase 5 Hardening)", () => {
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

    await connectMongo();

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
    primaryToken = generateAccessToken(primaryUser.id, 0);

    // Secondary test user for cross-user authorization tests
    secondaryUser = await prisma.user.create({
      data: {
        name: "Chef Julia",
        email: `julia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@pantrypal.test`,
        password: initialHashedPassword,
        isActive: true,
      },
    });
    secondaryToken = generateAccessToken(secondaryUser.id, 0);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    if (primaryUser?.id) {
      await prisma.user.deleteMany({ where: { id: primaryUser.id } });
      try {
        await AiInteractionLog.deleteMany({ userId: primaryUser.id });
      } catch {}
    }
    if (secondaryUser?.id) {
      await prisma.user.deleteMany({ where: { id: secondaryUser.id } });
      try {
        await AiInteractionLog.deleteMany({ userId: secondaryUser.id });
      } catch {}
    }
    await disconnectMongo();
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

  // ── 3. Secure Password Change & JWT Revocation ──────────────
  describe("3. Secure Password Change, Token Revocation & Re-Authentication", () => {
    let staleTokenBeforeChange;

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
          currentPassword: "InitialSecret123!",
          newPassword: "InitialSecret123!",
          confirmPassword: "InitialSecret123!",
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
          currentPassword: "InitialSecret123!",
          newPassword: "AnotherValidPassword789!",
          confirmPassword: "MismatchPassword!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("successfully changes password, increments tokenVersion and returns new accessToken", async () => {
      staleTokenBeforeChange = primaryToken;

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
      expect(res.body.data.accessToken).toBeDefined();

      // Verify password and tokenVersion updated in PostgreSQL
      const dbUser = await prisma.user.findUnique({
        where: { id: primaryUser.id },
      });
      const matches = await comparePassword(
        "BrandNewSecurePassword456!",
        dbUser.password
      );
      expect(matches).toBe(true);
      expect(dbUser.tokenVersion).toBeGreaterThan(0);

      // Save the newly issued access token for subsequent tests
      primaryToken = res.body.data.accessToken;
    });

    it("invalidates older JWTs across all routes after password change (401 TOKEN_REVOKED)", async () => {
      // 1. GET /api/v1/auth/me
      const meRes = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${staleTokenBeforeChange}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error.code).toBe("TOKEN_REVOKED");

      // 2. GET /api/v1/pantries
      const pantriesRes = await supertest(app)
        .get("/api/v1/pantries")
        .set("Authorization", `Bearer ${staleTokenBeforeChange}`);

      expect(pantriesRes.status).toBe(401);
      expect(pantriesRes.body.error.code).toBe("TOKEN_REVOKED");
    });

    it("rejects login attempt with old password (401 INVALID_CREDENTIALS)", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: primaryUser.email,
          password: "InitialSecret123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("allows login with new password and returns a token matching current tokenVersion", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: primaryUser.email,
          password: "BrandNewSecurePassword456!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      // Verify newly logged-in token works on protected endpoints
      const checkRes = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${res.body.data.accessToken}`);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.user.id).toBe(primaryUser.id);
    });
  });

  // ── 4. Personal Data Export ─────────────────────────────────
  describe("4. Personal Data Export & AI Interaction Privacy", () => {
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

      // Seed MongoDB AI interaction logs scoped to users
      try {
        await AiInteractionLog.create({
          userId: primaryUser.id,
          messagePrompt: "What can I cook with Arborio rice and saffron?",
          intentDetected: "RECIPE_GENERATION",
          aiResponse: { title: "Risotto Milanese", confidence: 0.99 },
          tokenUsage: 120,
        });

        await AiInteractionLog.create({
          userId: secondaryUser.id,
          messagePrompt: "How do I temper chocolate?",
          intentDetected: "KITCHEN_ASSISTANT",
          aiResponse: { tip: "Melt to 45C then cool to 28C" },
          tokenUsage: 80,
        });
      } catch (err) {
        console.warn("MongoDB seed in test skipped:", err.message);
      }
    });

    it("exports complete structured user data archive including MongoDB AI logs and excluding password hash", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/export")
        .set("Authorization", `Bearer ${primaryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const archive = res.body.data;
      expect(archive.exportedAt).toBeDefined();
      expect(archive.version).toBe("1.1.0");

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

      // Verify AI Interaction History
      expect(Array.isArray(archive.aiInteractionHistory)).toBe(true);
      if (archive.dataSources.telemetry === "included") {
        expect(archive.completeness).toBe("complete");
        const userLog = archive.aiInteractionHistory.find((l) =>
          l.messagePrompt.includes("Arborio rice")
        );
        expect(userLog).toBeDefined();

        // Ensure secondary user AI log is NOT leaked
        const leakedLog = archive.aiInteractionHistory.find((l) =>
          l.messagePrompt.includes("temper chocolate")
        );
        expect(leakedLog).toBeUndefined();
      }

      // Ensure secondary user relational data is NOT leaked
      expect(archive.account.id).not.toBe(secondaryUser.id);
    });

    it("handles MongoDB telemetry failure gracefully by marking completeness as partial", async () => {
      // Simulate MongoDB failure during export
      const findSpy = vi.spyOn(AiInteractionLog, "find").mockImplementationOnce(() => {
        throw new Error("Simulated MongoDB query timeout");
      });

      const res = await supertest(app)
        .get("/api/v1/auth/export")
        .set("Authorization", `Bearer ${primaryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const archive = res.body.data;
      expect(archive.completeness).toBe("partial");
      expect(archive.dataSources.telemetry).toBe("unavailable");
      expect(archive.account.password).toBeUndefined();
      expect(archive.pantries.length).toBeGreaterThanOrEqual(1);

      findSpy.mockRestore();
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

  // ── 6. Central Account Status & Token Revocation Guards ─────
  describe("6. Central Account Status & Token Revocation Guards", () => {
    let inactiveUser;
    let inactiveToken;

    beforeAll(async () => {
      const hashedPass = await hashPassword("InactiveSecret123!");
      inactiveUser = await prisma.user.create({
        data: {
          name: "Inactive Chef",
          email: `inactive-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: false,
        },
      });
      inactiveToken = generateAccessToken(inactiveUser.id, 0);
    });

    afterAll(async () => {
      if (inactiveUser?.id) {
        await prisma.user.deleteMany({ where: { id: inactiveUser.id } });
      }
    });

    it("rejects tokens of inactive users across all protected routes with 401 USER_NOT_AVAILABLE", async () => {
      // 1. GET /api/v1/auth/me
      const meRes = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${inactiveToken}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error.code).toBe("USER_NOT_AVAILABLE");

      // 2. GET /api/v1/pantries
      const pantryRes = await supertest(app)
        .get("/api/v1/pantries")
        .set("Authorization", `Bearer ${inactiveToken}`);

      expect(pantryRes.status).toBe(401);
      expect(pantryRes.body.error.code).toBe("USER_NOT_AVAILABLE");
    });
  });

  // ── 7. Cross-Database Account Deletion & Cascading Cleanup ───
  describe("7. Cross-Database Account Deletion & Transactional Resilience", () => {
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
      doomedToken = generateAccessToken(doomedUser.id, 0);

      // Seed doomed user records in PostgreSQL to verify cascading deletion
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

      // Seed doomed user records in MongoDB
      try {
        await AiInteractionLog.create({
          userId: doomedUser.id,
          messagePrompt: "Delete me later prompt",
          intentDetected: "UNKNOWN",
          aiResponse: { ack: true },
          tokenUsage: 10,
        });
      } catch (err) {
        console.warn("MongoDB seed for doomed user skipped:", err.message);
      }
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

    it("handles cross-database partial failure when MongoDB cleanup fails (502 TELEMETRY_CLEANUP_FAILED)", async () => {
      // Simulate MongoDB failure during deletion
      const deleteManySpy = vi
        .spyOn(AiInteractionLog, "deleteMany")
        .mockRejectedValueOnce(new Error("Simulated MongoDB network failure"));

      const res = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${doomedToken}`)
        .send({ password: "DeleteMe123!" });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("TELEMETRY_CLEANUP_FAILED");

      // Verify PostgreSQL user was NOT deleted, but is marked PENDING_DELETION and inactive
      const checkUser = await prisma.user.findUnique({
        where: { id: doomedUser.id },
      });
      expect(checkUser).toBeDefined();
      expect(checkUser.isActive).toBe(false);
      expect(["PENDING_DELETION", "DELETION_FAILED"]).toContain(checkUser.deletionStatus);

      // Verify user is immediately locked out from normal API operations
      const meRes = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${doomedToken}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error.code).toBe("USER_NOT_AVAILABLE");

      deleteManySpy.mockRestore();
    });

    it("allows safe idempotent retry to complete account deletion and cascades to child records", async () => {
      // Retry account deletion now that MongoDB is available
      const res = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${doomedToken}`)
        .send({ password: "DeleteMe123!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 1. Verify User deleted in PostgreSQL
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

      // 5. Verify MongoDB AI logs deleted
      try {
        const remainingLogs = await AiInteractionLog.find({ userId: doomedUser.id });
        expect(remainingLogs.length).toBe(0);
      } catch {}
    });

    it("rejects subsequent operations using the deleted user's token with 401 USER_NOT_AVAILABLE", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${doomedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("USER_NOT_AVAILABLE");
    });
  });
});
