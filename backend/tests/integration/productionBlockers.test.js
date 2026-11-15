import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import supertest from "supertest";
import express from "express";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { connectMongo, disconnectMongo } from "../../src/config/mongo.js";
import { AiInteractionLog } from "../../src/models/AiInteractionLog.js";
import { UnstructuredRecipe } from "../../src/models/UnstructuredRecipe.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { hashPassword } from "../../src/utils/password.js";
import {
  assertAuthorizedTestDatabase,
  isAuthorizedMongoTestUri,
  sanitizeDatabaseUrl,
} from "../../src/utils/testDatabaseGuard.js";
import {
  deleteUserAccount,
  retryAccountDeletion,
  reconcilePendingAccountDeletions,
} from "../../src/services/authService.js";
import { getAuthLimiter, getAiLimiter, sharedAiLimiter } from "../../src/config/security.js";
import { generateAIResponse } from "../../src/services/aiService.js";
import * as aiService from "../../src/services/aiService.js";
import { generateRecipeFromPantry } from "../../src/services/aiRecipeService.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";

describe("Phase 6 Production Release Blockers Suite", () => {
  beforeAll(async () => {
    await assertAuthorizedTestDatabase(prisma);
    await connectMongo();
    expect(isAuthorizedMongoTestUri(process.env.MONGO_TEST_URI)).toBe(true);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await disconnectMongo();
  });

  // ── 1. Complete MongoDB Account Erasure (UnstructuredRecipe) ─
  describe("1. Complete MongoDB Account Erasure (UnstructuredRecipe)", () => {
    let userA, userB;
    let tokenA, tokenB;
    const passwordA = "SecretPass123!";
    const passwordB = "SecretPass456!";

    beforeEach(async () => {
      const hashedA = await hashPassword(passwordA);
      const hashedB = await hashPassword(passwordB);

      userA = await prisma.user.create({
        data: {
          name: "User A MongoDB Erasure",
          email: `usera-erasure-${Date.now()}@pantrypal.test`,
          password: hashedA,
          isActive: true,
        },
      });
      tokenA = generateAccessToken(userA.id, 0);

      userB = await prisma.user.create({
        data: {
          name: "User B MongoDB Erasure",
          email: `userb-erasure-${Date.now()}@pantrypal.test`,
          password: hashedB,
          isActive: true,
        },
      });
      tokenB = generateAccessToken(userB.id, 0);

      // Seed both AiInteractionLog and UnstructuredRecipe for both users
      await AiInteractionLog.create([
        {
          userId: userA.id,
          messagePrompt: "AI Prompt User A",
          intentDetected: "RECIPE_GENERATION",
          aiResponse: "AI Response User A",
          tokenUsage: 45,
        },
        {
          userId: userB.id,
          messagePrompt: "AI Prompt User B",
          intentDetected: "RECIPE_GENERATION",
          aiResponse: "AI Response User B",
          tokenUsage: 55,
        },
      ]);

      await UnstructuredRecipe.create([
        {
          userId: userA.id,
          sourcePrompt: "Grandma's secret sauce recipe",
          rawOutput: { title: "Secret Sauce", ingredients: ["Tomato", "Garlic"] },
          conversionStatus: "NORMALIZED",
        },
        {
          userId: userB.id,
          sourcePrompt: "Grandpa's stew recipe",
          rawOutput: { title: "Hearty Stew", ingredients: ["Beef", "Potatoes"] },
          conversionStatus: "NORMALIZED",
        },
      ]);
    });

    afterEach(async () => {
      if (userA?.id) {
        await prisma.user.deleteMany({ where: { id: userA.id } });
        await AiInteractionLog.deleteMany({ userId: userA.id });
        await UnstructuredRecipe.deleteMany({ userId: userA.id });
      }
      if (userB?.id) {
        await prisma.user.deleteMany({ where: { id: userB.id } });
        await AiInteractionLog.deleteMany({ userId: userB.id });
        await UnstructuredRecipe.deleteMany({ userId: userB.id });
      }
    });

    it("includes UnstructuredRecipe in personal data export and excludes other users' recipes", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/export")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const archive = res.body.data;
      expect(archive.unstructuredRecipes).toBeDefined();
      expect(Array.isArray(archive.unstructuredRecipes)).toBe(true);
      expect(archive.unstructuredRecipes.length).toBe(1);
      expect(archive.unstructuredRecipes[0].sourcePrompt).toBe("Grandma's secret sauce recipe");

      // Verify User B's unstructured recipe is NOT leaked
      const leakedRecipe = archive.unstructuredRecipes.find(
        (r) => r.sourcePrompt === "Grandpa's stew recipe"
      );
      expect(leakedRecipe).toBeUndefined();
    });

    it("erases UnstructuredRecipe and AiInteractionLog upon normal account deletion while preserving other users", async () => {
      const res = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ password: passwordA });

      expect(res.status).toBe(200);

      // User A is completely erased from PostgreSQL and MongoDB
      const pgUserA = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(pgUserA).toBeNull();

      const userALogs = await AiInteractionLog.find({ userId: userA.id });
      expect(userALogs.length).toBe(0);

      const userARecipes = await UnstructuredRecipe.find({ userId: userA.id });
      expect(userARecipes.length).toBe(0);

      // User B remains completely intact in both PostgreSQL and MongoDB
      const pgUserB = await prisma.user.findUnique({ where: { id: userB.id } });
      expect(pgUserB).not.toBeNull();

      const userBLogs = await AiInteractionLog.find({ userId: userB.id });
      expect(userBLogs.length).toBe(1);

      const userBRecipes = await UnstructuredRecipe.find({ userId: userB.id });
      expect(userBRecipes.length).toBe(1);
    });

    it("erases UnstructuredRecipe during retryAccountDeletion", async () => {
      // Put User A in PENDING_DELETION state
      await prisma.user.update({
        where: { id: userA.id },
        data: { deletionStatus: "PENDING_DELETION", isActive: false },
      });

      const res = await retryAccountDeletion({
        email: userA.email,
        password: passwordA,
      });

      expect(res.status).toBe("COMPLETED");

      const pgUserA = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(pgUserA).toBeNull();

      const userARecipes = await UnstructuredRecipe.find({ userId: userA.id });
      expect(userARecipes.length).toBe(0);
    });

    it("erases UnstructuredRecipe during background reconciliation", async () => {
      // Put User A in DELETION_FAILED state
      await prisma.user.update({
        where: { id: userA.id },
        data: { deletionStatus: "DELETION_FAILED", isActive: false },
      });

      const result = await reconcilePendingAccountDeletions();
      expect(result.reconciled).toBeGreaterThanOrEqual(1);

      const pgUserA = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(pgUserA).toBeNull();

      const userARecipes = await UnstructuredRecipe.find({ userId: userA.id });
      expect(userARecipes.length).toBe(0);
    });

    it("fences in-flight recipe generation when account deletion occurs before persistence", async () => {
      const pantryA = await prisma.pantry.create({
        data: {
          name: "User A Pantry",
          userId: userA.id,
          items: {
            create: [
              { name: "Pasta", quantity: 500, unit: "g" },
              { name: "Tomato Sauce", quantity: 1, unit: "can" },
            ],
          },
        },
      });

      const userBRecipesBefore = await UnstructuredRecipe.find({ userId: userB.id });
      expect(userBRecipesBefore.length).toBeGreaterThanOrEqual(1);

      const mockRecipe = {
        title: "Quick Tomato Pasta",
        description: "Simple pantry meal",
        servings: 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        estimatedCost: 5.5,
        ingredients: [
          { name: "Pasta", quantity: 200, unit: "g", available: true },
          { name: "Tomato Sauce", quantity: 1, unit: "can", available: true },
        ],
        missingIngredients: [],
        instructions: ["Boil pasta", "Mix with sauce"],
        nutritionPerServing: { calories: 350, protein: 12, carbs: 65, fat: 4 },
      };

      const aiSpy = vi
        .spyOn(aiService, "generateStructuredAIResponse")
        .mockImplementation(async () => {
          await deleteUserAccount({
            userId: userA.id,
            password: passwordA,
          });
          return mockRecipe;
        });

      const result = await generateRecipeFromPantry({
        userId: userA.id,
        pantryId: pantryA.id,
      });

      expect(result.recipe.title).toBe("Quick Tomato Pasta");

      const deletedUser = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(deletedUser).toBeNull();

      const userARecipes = await UnstructuredRecipe.find({ userId: userA.id });
      expect(userARecipes).toHaveLength(0);

      const userALogs = await AiInteractionLog.find({ userId: userA.id });
      expect(userALogs).toHaveLength(0);

      const userBRecipesAfter = await UnstructuredRecipe.find({ userId: userB.id });
      expect(userBRecipesAfter.length).toBe(userBRecipesBefore.length);

      aiSpy.mockRestore();
    });

    it("compensating rollback purges newly created document if user entered deletion concurrently", async () => {
      const hashed = await hashPassword("TestPass123!");
      const userC = await prisma.user.create({
        data: {
          name: "User C Race",
          email: `userc-race-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
        },
      });

      const pantryC = await prisma.pantry.create({
        data: {
          name: "User C Pantry",
          userId: userC.id,
          items: {
            create: [{ name: "Rice", quantity: 1, unit: "kg" }],
          },
        },
      });

      const mockRecipe = {
        title: "Fried Rice",
        description: "Crispy rice dish",
        servings: 1,
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        estimatedCost: 3.0,
        ingredients: [{ name: "Rice", quantity: 200, unit: "g", available: true }],
        missingIngredients: [],
        instructions: ["Cook rice", "Fry"],
      };

      const aiSpy = vi
        .spyOn(aiService, "generateStructuredAIResponse")
        .mockImplementation(async () => {
          await prisma.user.update({
            where: { id: userC.id },
            data: { isActive: false, deletionStatus: "PENDING_DELETION" },
          });
          return mockRecipe;
        });

      await generateRecipeFromPantry({
        userId: userC.id,
        pantryId: pantryC.id,
      });

      const userCRecipes = await UnstructuredRecipe.find({ userId: userC.id });
      expect(userCRecipes).toHaveLength(0);

      aiSpy.mockRestore();
    });
  });

  // ── 2. Dedicated Authentication Rate Limiting ────────────────
  describe("2. Dedicated Authentication Rate Limiting", () => {
    it("returns HTTP 429 when login requests exceed the configured threshold", async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post(
        "/api/v1/auth/login",
        getAuthLimiter({ max: 3, windowMs: 60000 }),
        (req, res) => res.status(200).json({ success: true })
      );

      // Requests 1-3: Allowed
      const r1 = await supertest(testApp).post("/api/v1/auth/login");
      expect(r1.status).toBe(200);

      const r2 = await supertest(testApp).post("/api/v1/auth/login");
      expect(r2.status).toBe(200);

      const r3 = await supertest(testApp).post("/api/v1/auth/login");
      expect(r3.status).toBe(200);

      // Request 4: Blocked with HTTP 429
      const r4 = await supertest(testApp).post("/api/v1/auth/login");
      expect(r4.status).toBe(429);
      expect(r4.body.success).toBe(false);
      expect(r4.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(r4.body.error.message).toContain("Too many authentication attempts");

      // Verify Standard RateLimit Headers
      expect(r4.headers["ratelimit-limit"]).toBeDefined();
      expect(r4.headers["ratelimit-remaining"]).toBe("0");
    });

    it("returns HTTP 429 when registration requests exceed the configured threshold", async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post(
        "/api/v1/auth/register",
        getAuthLimiter({ max: 2, windowMs: 60000 }),
        (req, res) => res.status(201).json({ success: true })
      );

      const r1 = await supertest(testApp).post("/api/v1/auth/register");
      expect(r1.status).toBe(201);

      const r2 = await supertest(testApp).post("/api/v1/auth/register");
      expect(r2.status).toBe(201);

      const r3 = await supertest(testApp).post("/api/v1/auth/register");
      expect(r3.status).toBe(429);
      expect(r3.body.success).toBe(false);
      expect(r3.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });
  });

  // ── 3. Per-User AI Rate Limiting & Upstream Quota Errors ──────
  describe("3. Per-User AI Rate Limiting & Upstream Quota Handling", () => {
    it("enforces AI rate limits per authenticated user ID and isolates users", async () => {
      const testApp = express();
      testApp.use(express.json());

      // Mock auth middleware simulating User 1 and User 2
      testApp.use((req, res, next) => {
        const auth = req.headers.authorization;
        if (auth === "Bearer token-user-1") {
          req.user = { id: "user-1" };
        } else if (auth === "Bearer token-user-2") {
          req.user = { id: "user-2" };
        }
        next();
      });

      testApp.post(
        "/api/v1/ai/chat",
        getAiLimiter({ max: 2, windowMs: 60000 }),
        (req, res) => res.status(200).json({ success: true })
      );

      // User 1 consumes allowance
      const u1_r1 = await supertest(testApp)
        .post("/api/v1/ai/chat")
        .set("Authorization", "Bearer token-user-1");
      expect(u1_r1.status).toBe(200);

      const u1_r2 = await supertest(testApp)
        .post("/api/v1/ai/chat")
        .set("Authorization", "Bearer token-user-1");
      expect(u1_r2.status).toBe(200);

      // User 1 exceeds limit -> 429
      const u1_r3 = await supertest(testApp)
        .post("/api/v1/ai/chat")
        .set("Authorization", "Bearer token-user-1");
      expect(u1_r3.status).toBe(429);
      expect(u1_r3.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(u1_r3.body.error.message).toContain("AI request quota exceeded");

      // User 2 has NOT exhausted their allowance and can still make requests
      const u2_r1 = await supertest(testApp)
        .post("/api/v1/ai/chat")
        .set("Authorization", "Bearer token-user-2");
      expect(u2_r1.status).toBe(200);
    });

    it("shares rate limit quota across all AI endpoints using the unified limiter", async () => {
      const testApp = express();
      testApp.use(express.json());

      testApp.use((req, res, next) => {
        req.user = { id: "user-shared-limiter" };
        next();
      });

      const unifiedLimiter = getAiLimiter({ max: 3, windowMs: 60000 });

      testApp.post("/api/v1/ai/chat", unifiedLimiter, (req, res) =>
        res.status(200).json({ endpoint: "chat" })
      );
      testApp.post("/api/v1/ai/recipes/generate", unifiedLimiter, (req, res) =>
        res.status(200).json({ endpoint: "recipes" })
      );
      testApp.post("/api/v1/ai/recommendations", unifiedLimiter, (req, res) =>
        res.status(200).json({ endpoint: "recommendations" })
      );

      const res1 = await supertest(testApp).post("/api/v1/ai/chat");
      expect(res1.status).toBe(200);

      const res2 = await supertest(testApp).post("/api/v1/ai/recipes/generate");
      expect(res2.status).toBe(200);

      const res3 = await supertest(testApp).post("/api/v1/ai/recommendations");
      expect(res3.status).toBe(200);

      const res4 = await supertest(testApp).post("/api/v1/ai/chat");
      expect(res4.status).toBe(429);
      expect(res4.body.error.code).toBe("RATE_LIMIT_EXCEEDED");

      const res5 = await supertest(testApp).post("/api/v1/ai/recipes/generate");
      expect(res5.status).toBe(429);
    });

    it("translates upstream Gemini quota exhaustion into HTTP 429 AI_QUOTA_EXCEEDED", async () => {
      process.env.LLM_API_KEY = process.env.LLM_API_KEY || "mock-gemini-key";
      process.env.LLM_MODEL = process.env.LLM_MODEL || "gemini-2.5-flash";

      const mockQuotaError = new Error("429 Resource has been exhausted (e.g. check quota)");
      mockQuotaError.status = 429;

      const { GoogleGenAI } = await import("@google/genai");
      const dummy = new GoogleGenAI({ apiKey: "mock" });
      const proto = Object.getPrototypeOf(dummy.models);

      const spy = vi
        .spyOn(proto, "generateContentInternal")
        .mockRejectedValue(mockQuotaError);

      await expect(
        generateAIResponse({
          systemInstruction: "You are a chef",
          prompt: "Suggest a soup",
        })
      ).rejects.toMatchObject({
        statusCode: 429,
        code: "AI_QUOTA_EXCEEDED",
        message: expect.stringContaining("AI provider quota exceeded"),
      });

      spy.mockRestore();
    });
  });

  // ── 4. Error Handler Credential Sanitization ───────────────────
  describe("4. Error Handler Credential Sanitization", () => {
    it("redacts sensitive connection strings from error handler console output", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const sensitiveError = new Error(
        "Connection failed to postgresql://admin:superSecret123@db.example.com:5432/pantrypal?password=superSecret123"
      );

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      errorHandler(sensitiveError, mockReq, mockRes, () => {});

      expect(consoleSpy).toHaveBeenCalled();
      const loggedOutput = consoleSpy.mock.calls[0][0];

      // Ensure credentials are fully redacted
      expect(loggedOutput).not.toContain("superSecret123");
      expect(loggedOutput).toContain("******");

      consoleSpy.mockRestore();
    });
  });
});
