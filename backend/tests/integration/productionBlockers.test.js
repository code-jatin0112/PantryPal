import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import supertest from "supertest";
import express from "express";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { connectMongo, disconnectMongo } from "../../src/config/mongo.js";
import { AiInteractionLog } from "../../src/models/AiInteractionLog.js";
import { UnstructuredRecipe } from "../../src/models/UnstructuredRecipe.js";
import { DeletionObligation } from "../../src/models/DeletionObligation.js";
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
import { chatWithKitchenAssistant } from "../../src/services/aiChatService.js";
import {
  computeObligationKey,
  safePersistUserMongoRecord,
  recordDeletionObligation,
  resolvePostgresDeletionObligation,
  resolveMongoDeletionObligation,
  resolveDeletionObligation,
} from "../../src/utils/dataErasureCoordinator.js";
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

  // ── 5. Durable Data Erasure & In-Flight Fencing Verification ──
  describe("5. Durable Data Erasure & In-Flight Fencing Verification", () => {
    let testUserA, testUserB;
    const passwordA = "ErasurePass123!";
    const passwordB = "ErasurePass456!";

    beforeEach(async () => {
      const hashedA = await hashPassword(passwordA);
      const hashedB = await hashPassword(passwordB);

      testUserA = await prisma.user.create({
        data: {
          name: "User A Fencing",
          email: `usera-fence-${Date.now()}@pantrypal.test`,
          password: hashedA,
          isActive: true,
        },
      });

      testUserB = await prisma.user.create({
        data: {
          name: "User B Isolation",
          email: `userb-fence-${Date.now()}@pantrypal.test`,
          password: hashedB,
          isActive: true,
        },
      });

      // Seed baseline records for User B
      await AiInteractionLog.create({
        userId: testUserB.id,
        messagePrompt: "User B Baseline Prompt",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: { reply: "User B response" },
        tokenUsage: 50,
      });

      await UnstructuredRecipe.create({
        userId: testUserB.id,
        sourcePrompt: "User B Baseline Recipe",
        rawOutput: { title: "User B Recipe" },
        conversionStatus: "NORMALIZED",
      });
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      if (testUserA?.id) {
        await prisma.user.deleteMany({ where: { id: testUserA.id } });
        await prisma.accountDeletionObligation.deleteMany({ where: { userId: testUserA.id } });
        await AiInteractionLog.deleteMany({ userId: testUserA.id });
        await UnstructuredRecipe.deleteMany({ userId: testUserA.id });
        await DeletionObligation.deleteMany({ userId: testUserA.id });
      }
      if (testUserB?.id) {
        await prisma.user.deleteMany({ where: { id: testUserB.id } });
        await prisma.accountDeletionObligation.deleteMany({ where: { userId: testUserB.id } });
        await AiInteractionLog.deleteMany({ userId: testUserB.id });
        await UnstructuredRecipe.deleteMany({ userId: testUserB.id });
        await DeletionObligation.deleteMany({ userId: testUserB.id });
      }
    });

    it("pause AI generation, delete user, resume AI: produces zero orphaned records in MongoDB", async () => {
      let resumeAiGeneration;
      const aiGenerationPaused = new Promise((resolve) => {
        resumeAiGeneration = resolve;
      });

      const aiSpy = vi
        .spyOn(aiService, "generateStructuredAIResponse")
        .mockImplementation(async () => {
          // Pause execution until user account deletion completes
          await aiGenerationPaused;
          return {
            reply: "Your recipe guidance",
            intent: "KITCHEN_ASSISTANT",
            relevantItems: [],
            suggestedActions: [],
            warnings: [],
          };
        });

      // 1. Initiate in-flight AI generation request for User A
      const inFlightChatPromise = chatWithKitchenAssistant({
        userId: testUserA.id,
        message: "What can I cook with tomatoes?",
      });

      // Give event loop time to enter AI service
      await new Promise((r) => setTimeout(r, 50));

      // 2. Finalize account deletion for User A while AI generation is in-flight
      const deletionResult = await deleteUserAccount({
        userId: testUserA.id,
        password: passwordA,
      });
      expect(deletionResult.message).toContain("deleted successfully");

      // Verify User A row is permanently deleted from PostgreSQL
      const pgUserAfterDelete = await prisma.user.findUnique({
        where: { id: testUserA.id },
      });
      expect(pgUserAfterDelete).toBeNull();

      // 3. Resume the in-flight AI request
      resumeAiGeneration();
      await inFlightChatPromise;

      // 4. Verify ZERO orphaned MongoDB records exist for User A
      const userALogs = await AiInteractionLog.find({ userId: testUserA.id });
      expect(userALogs).toHaveLength(0);

      const userARecipes = await UnstructuredRecipe.find({ userId: testUserA.id });
      expect(userARecipes).toHaveLength(0);

      // 5. Verify tenant isolation: User B's records remain completely intact
      const userBLogs = await AiInteractionLog.find({ userId: testUserB.id });
      expect(userBLogs).toHaveLength(1);

      const userBRecipes = await UnstructuredRecipe.find({ userId: testUserB.id });
      expect(userBRecipes).toHaveLength(1);

      aiSpy.mockRestore();
    });

    it("simulates post-write verification failure and executes compensating rollback", async () => {
      let createdDocId = null;

      // Execute safe persist where user is deactivated right after document creation
      const result = await safePersistUserMongoRecord({
        userId: testUserA.id,
        targetCollection: "AiInteractionLog",
        createRecordFn: async () => {
          const doc = await AiInteractionLog.create({
            userId: testUserA.id,
            messagePrompt: "Prompt right before deactivation",
            intentDetected: "KITCHEN_ASSISTANT",
            aiResponse: { reply: "Test reply" },
            tokenUsage: 30,
          });
          createdDocId = doc._id;

          // Simulate user concurrently deactivated or queued for deletion
          await prisma.user.update({
            where: { id: testUserA.id },
            data: { isActive: false, deletionStatus: "PENDING_DELETION" },
          });

          return doc;
        },
      });

      // Verification failed -> function must return null
      expect(result).toBeNull();

      // Compensating rollback must have deleted the document
      expect(createdDocId).not.toBeNull();
      const docInDb = await AiInteractionLog.findById(createdDocId);
      expect(docInDb).toBeNull();
    });

    it("simulates compensating deletion failure: does not swallow error and records durable obligation", async () => {
      let createdDocId = null;

      // Mock deleteOne to simulate MongoDB failure during rollback
      const deleteSpy = vi
        .spyOn(AiInteractionLog, "deleteOne")
        .mockRejectedValueOnce(new Error("Simulated MongoDB delete failure"));

      let thrownError = null;
      try {
        await safePersistUserMongoRecord({
          userId: testUserA.id,
          targetCollection: "AiInteractionLog",
          createRecordFn: async () => {
            const doc = await AiInteractionLog.create({
              userId: testUserA.id,
              messagePrompt: "Prompt with rollback failure",
              intentDetected: "KITCHEN_ASSISTANT",
              aiResponse: { reply: "Test" },
              tokenUsage: 25,
            });
            createdDocId = doc._id;

            // Deactivate user to trigger compensating rollback
            await prisma.user.update({
              where: { id: testUserA.id },
              data: { isActive: false, deletionStatus: "PENDING_DELETION" },
            });

            return doc;
          },
        });
      } catch (err) {
        thrownError = err;
      }

      // 1. Error MUST NOT be swallowed
      expect(thrownError).not.toBeNull();
      expect(thrownError.message).toContain("Simulated MongoDB delete failure");

      // 2. Durable obligation MUST be recorded in PostgreSQL AccountDeletionObligation
      const pgObligation = await prisma.accountDeletionObligation.findFirst({
        where: { userId: testUserA.id },
      });
      expect(pgObligation).not.toBeNull();
      expect(pgObligation.status).toBe("FAILED");
      expect(pgObligation.documentId).toBe(String(createdDocId));
      expect(pgObligation.targetCollection).toBe("AiInteractionLog");
      expect(pgObligation.lastError).toContain("Simulated MongoDB delete failure");

      // 3. Durable obligation MUST also exist in MongoDB
      const mongoObligation = await DeletionObligation.findOne({
        userId: testUserA.id,
      });
      expect(mongoObligation).not.toBeNull();
      expect(mongoObligation.status).toBe("FAILED");

      deleteSpy.mockRestore();
    });

    it("simulates worker restart and cleanup recovery without depending on PostgreSQL User row", async () => {
      const orphanUserId = `orphan-${Date.now()}`;

      // Ensure NO PostgreSQL User row exists for this orphan user
      const existingUser = await prisma.user.findUnique({
        where: { id: orphanUserId },
      });
      expect(existingUser).toBeNull();

      // Seed orphaned records directly into MongoDB
      await AiInteractionLog.create({
        userId: orphanUserId,
        messagePrompt: "Orphaned AI prompt after process restart",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: { reply: "Orphaned" },
        tokenUsage: 40,
      });

      await UnstructuredRecipe.create({
        userId: orphanUserId,
        sourcePrompt: "Orphaned Recipe Prompt",
        rawOutput: { title: "Orphaned Soup" },
        conversionStatus: "NORMALIZED",
      });

      // Durably record deletion obligations in PostgreSQL and MongoDB
      await recordDeletionObligation({
        userId: orphanUserId,
        targetCollection: "ALL",
        status: "FAILED",
        error: "Previous worker crashed before cleanup",
      });

      // Verify obligations are persisted
      const pgObBefore = await prisma.accountDeletionObligation.findFirst({
        where: { userId: orphanUserId },
      });
      expect(pgObBefore).not.toBeNull();
      expect(pgObBefore.status).toBe("FAILED");

      // Run background reconciliation (simulates new worker startup / cron)
      const reconResult = await reconcilePendingAccountDeletions();
      expect(reconResult.reconciled).toBeGreaterThanOrEqual(1);

      // Verify all orphaned records are cleanly purged from MongoDB
      const remainingLogs = await AiInteractionLog.find({ userId: orphanUserId });
      expect(remainingLogs).toHaveLength(0);

      const remainingRecipes = await UnstructuredRecipe.find({ userId: orphanUserId });
      expect(remainingRecipes).toHaveLength(0);

      // Verify obligations are resolved across PostgreSQL and MongoDB
      const pgObAfter = await prisma.accountDeletionObligation.findFirst({
        where: { userId: orphanUserId },
      });
      expect(pgObAfter).toBeNull();

      const mongoObAfter = await DeletionObligation.findOne({ userId: orphanUserId });
      expect(mongoObAfter).toBeNull();
    });

    it("handles MongoDB cleanup failure during deleteUserAccount and retryAccountDeletion with 502 and prevents false success", async () => {
      // Simulate MongoDB failure during cleanup
      const mongoDeleteSpy = vi
        .spyOn(UnstructuredRecipe, "deleteMany")
        .mockRejectedValue(new Error("Simulated MongoDB cluster failure"));

      // 1. Initial delete attempt fails on MongoDB
      let deleteErr = null;
      try {
        await deleteUserAccount({
          userId: testUserA.id,
          password: passwordA,
        });
      } catch (err) {
        deleteErr = err;
      }

      expect(deleteErr).not.toBeNull();
      expect(deleteErr.statusCode).toBe(502);
      expect(deleteErr.code).toBe("TELEMETRY_CLEANUP_FAILED");

      // Verify user remains in PostgreSQL with DELETION_FAILED
      const userAfterFailedDelete = await prisma.user.findUnique({
        where: { id: testUserA.id },
      });
      expect(userAfterFailedDelete).not.toBeNull();
      expect(userAfterFailedDelete.isActive).toBe(false);
      expect(userAfterFailedDelete.deletionStatus).toBe("DELETION_FAILED");

      // Verify obligation was recorded as FAILED
      const failedObligation = await prisma.accountDeletionObligation.findFirst({
        where: { userId: testUserA.id },
      });
      expect(failedObligation).not.toBeNull();
      expect(failedObligation.status).toBe("FAILED");

      // 2. Retry deletion while MongoDB is still failing -> must fail with 502, NO false success
      let retryErr = null;
      try {
        await retryAccountDeletion({
          email: testUserA.email,
          password: passwordA,
        });
      } catch (err) {
        retryErr = err;
      }

      expect(retryErr).not.toBeNull();
      expect(retryErr.statusCode).toBe(502);
      expect(retryErr.code).toBe("TELEMETRY_CLEANUP_FAILED");

      // 3. Restore MongoDB and execute retry -> must succeed
      mongoDeleteSpy.mockRestore();

      const retrySuccess = await retryAccountDeletion({
        email: testUserA.email,
        password: passwordA,
      });

      expect(retrySuccess.status).toBe("COMPLETED");

      // Verify user is permanently deleted from PostgreSQL
      const userAfterFinalRetry = await prisma.user.findUnique({
        where: { id: testUserA.id },
      });
      expect(userAfterFinalRetry).toBeNull();

      // Verify obligation is fully resolved
      const resolvedObligation = await prisma.accountDeletionObligation.findFirst({
        where: { userId: testUserA.id },
      });
      expect(resolvedObligation).toBeNull();
    });
  });

  // ── 6. Obligation Safety, Isolation & Transactional Ordering ──
  describe("6. Obligation Safety, Isolation & Transactional Ordering Suite", () => {
    beforeEach(async () => {
      await prisma.accountDeletionObligation.deleteMany({});
      try {
        const { DeletionObligation } = await import("../../src/models/DeletionObligation.js");
        if (DeletionObligation) {
          await DeletionObligation.deleteMany({});
        }
      } catch (e) {}
    });

    it("A. Active user + document cleanup obligation: reconciles only the target document while user and application data survive", async () => {
      const hashed = await hashPassword("SafePass123!");
      const activeUser = await prisma.user.create({
        data: {
          name: "Active Chef Safe",
          email: `active-safe-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
          deletionStatus: null,
        },
      });

      const pantry = await prisma.pantry.create({
        data: {
          name: "Chef Safe Pantry",
          userId: activeUser.id,
          items: {
            create: [{ name: "Olive Oil", quantity: 500, unit: "ml" }],
          },
        },
      });

      // Two UnstructuredRecipe documents
      const docToClean = await UnstructuredRecipe.create({
        userId: activeUser.id,
        sourcePrompt: "Failed document to clean up",
        rawOutput: { title: "Bad Recipe" },
        conversionStatus: "NORMALIZED",
      });

      const docToKeep = await UnstructuredRecipe.create({
        userId: activeUser.id,
        sourcePrompt: "Valuable recipe to preserve",
        rawOutput: { title: "Good Recipe" },
        conversionStatus: "NORMALIZED",
      });

      const logToKeep = await AiInteractionLog.create({
        userId: activeUser.id,
        messagePrompt: "Helpful chat log to preserve",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: { reply: "Keep me" },
        tokenUsage: 10,
      });

      // Record a DOCUMENT_CLEANUP obligation specifically targeting docToClean
      await recordDeletionObligation({
        type: "DOCUMENT_CLEANUP",
        userId: activeUser.id,
        targetCollection: "UnstructuredRecipe",
        documentId: String(docToClean._id),
        status: "FAILED",
        error: "Compensating rollback failed previously",
      });

      // Run background reconciliation
      const reconResult = await reconcilePendingAccountDeletions();
      expect(reconResult.reconciled).toBeGreaterThanOrEqual(1);

      // 1. Target document was deleted
      const cleanedDoc = await UnstructuredRecipe.findById(docToClean._id);
      expect(cleanedDoc).toBeNull();

      // 2. Active user SURVIVES in PostgreSQL with isActive = true and deletionStatus = null
      const userInPg = await prisma.user.findUnique({
        where: { id: activeUser.id },
      });
      expect(userInPg).not.toBeNull();
      expect(userInPg.isActive).toBe(true);
      expect(userInPg.deletionStatus).toBeNull();

      // 3. Pantry, other recipes, and AI logs for this active user all SURVIVE
      const userPantry = await prisma.pantry.findUnique({
        where: { id: pantry.id },
        include: { items: true },
      });
      expect(userPantry).not.toBeNull();
      expect(userPantry.items).toHaveLength(1);

      const preservedRecipe = await UnstructuredRecipe.findById(docToKeep._id);
      expect(preservedRecipe).not.toBeNull();

      const preservedLog = await AiInteractionLog.findById(logToKeep._id);
      expect(preservedLog).not.toBeNull();

      // Cleanup
      await prisma.user.deleteMany({ where: { id: activeUser.id } });
      await UnstructuredRecipe.deleteMany({ userId: activeUser.id });
      await AiInteractionLog.deleteMany({ userId: activeUser.id });
    });

    it("B. Multiple failed documents belonging to the same user: each obligation remains independently recoverable without overwriting", async () => {
      const hashed = await hashPassword("MultiPass123!");
      const user = await prisma.user.create({
        data: {
          name: "Multi Doc User",
          email: `multidoc-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
        },
      });

      const doc1 = await UnstructuredRecipe.create({
        userId: user.id,
        sourcePrompt: "Failed doc 1",
        rawOutput: { title: "Recipe 1" },
        conversionStatus: "NORMALIZED",
      });

      const doc2 = await AiInteractionLog.create({
        userId: user.id,
        messagePrompt: "Failed doc 2",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: { reply: "Response 2" },
        tokenUsage: 15,
      });

      // Record obligation for doc 1
      const ob1 = await recordDeletionObligation({
        type: "DOCUMENT_CLEANUP",
        userId: user.id,
        targetCollection: "UnstructuredRecipe",
        documentId: String(doc1._id),
        status: "FAILED",
        error: "Failure 1",
      });

      // Record obligation for doc 2
      const ob2 = await recordDeletionObligation({
        type: "DOCUMENT_CLEANUP",
        userId: user.id,
        targetCollection: "AiInteractionLog",
        documentId: String(doc2._id),
        status: "FAILED",
        error: "Failure 2",
      });

      expect(ob1.obligationKey).not.toBe(ob2.obligationKey);

      // Both obligations must exist simultaneously in PostgreSQL
      const pgObs = await prisma.accountDeletionObligation.findMany({
        where: { userId: user.id },
      });
      expect(pgObs).toHaveLength(2);

      // Both obligations must exist simultaneously in MongoDB
      const mongoObs = await DeletionObligation.find({ userId: user.id });
      expect(mongoObs).toHaveLength(2);

      // Run reconciliation
      const reconResult = await reconcilePendingAccountDeletions();
      expect(reconResult.reconciled).toBeGreaterThanOrEqual(2);

      // Both documents are cleanly deleted
      expect(await UnstructuredRecipe.findById(doc1._id)).toBeNull();
      expect(await AiInteractionLog.findById(doc2._id)).toBeNull();

      // Both obligations are resolved
      const remainingPgObs = await prisma.accountDeletionObligation.findMany({
        where: { userId: user.id },
      });
      expect(remainingPgObs).toHaveLength(0);

      // User survives!
      const userStillAlive = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userStillAlive).not.toBeNull();
      expect(userStillAlive.isActive).toBe(true);

      // Cleanup
      await prisma.user.deleteMany({ where: { id: user.id } });
    });

    it("C. PostgreSQL account deletion rollback: recovery obligations survive", async () => {
      const hashed = await hashPassword("RollbackPass123!");
      const user = await prisma.user.create({
        data: {
          name: "Rollback User",
          email: `rollback-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
        },
      });

      const obligationKey = computeObligationKey({ type: "ACCOUNT_DELETION", userId: user.id });

      let txRolledBack = false;
      try {
        await prisma.$transaction(async (tx) => {
          // Record obligation inside tx
          await recordDeletionObligation({
            tx,
            type: "ACCOUNT_DELETION",
            userId: user.id,
            targetCollection: "ALL",
            status: "IN_PROGRESS",
          });

          // Transactionally resolve obligation inside tx
          await resolvePostgresDeletionObligation({ tx, obligationKey, userId: user.id });

          // Throw to simulate failure and trigger rollback
          throw new Error("Simulated database failure during transaction");
        });
      } catch (err) {
        txRolledBack = true;
      }

      expect(txRolledBack).toBe(true);

      // Because the transaction rolled back, MongoDB resolution was NEVER called!
      // The MongoDB obligation marker that was persisted survives!
      const mongoOb = await DeletionObligation.findOne({ obligationKey });
      expect(mongoOb).not.toBeNull();
      expect(mongoOb.status).toBe("IN_PROGRESS");

      // Cleanup
      await prisma.user.deleteMany({ where: { id: user.id } });
      await resolveDeletionObligation({ obligationKey, userId: user.id });
    });

    it("D. Process crash after PostgreSQL commit: MongoDB marker resolution remains safe and idempotent", async () => {
      const orphanUserId = `crash-test-${Date.now()}`;
      const obligationKey = computeObligationKey({ type: "ACCOUNT_DELETION", userId: orphanUserId });

      // PostgreSQL user is already gone, PostgreSQL obligation marker is already gone
      expect(await prisma.user.findUnique({ where: { id: orphanUserId } })).toBeNull();
      expect(await prisma.accountDeletionObligation.findFirst({ where: { obligationKey } })).toBeNull();

      // MongoDB still has the obligation marker and an orphaned log
      await AiInteractionLog.create({
        userId: orphanUserId,
        messagePrompt: "Crash orphan log",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: { reply: "Orphan" },
        tokenUsage: 10,
      });

      await DeletionObligation.create({
        obligationKey,
        type: "ACCOUNT_DELETION",
        userId: orphanUserId,
        targetCollection: "ALL",
        status: "IN_PROGRESS",
      });

      // Background reconciliation runs (new process startup)
      const result = await reconcilePendingAccountDeletions();
      expect(result.reconciled).toBeGreaterThanOrEqual(1);

      // Orphaned log is deleted
      expect(await AiInteractionLog.find({ userId: orphanUserId })).toHaveLength(0);

      // MongoDB obligation marker is safely resolved
      expect(await DeletionObligation.findOne({ obligationKey })).toBeNull();
    });

    it("E. PostgreSQL and MongoDB obligation-write failures: never falsely claims durable recovery", async () => {
      const fakeUserId = `fail-write-${Date.now()}`;

      // Mock both PostgreSQL and MongoDB writes to throw
      const pgSpy = vi.spyOn(prisma.accountDeletionObligation, "upsert").mockRejectedValue(new Error("PG network timeout"));

      let mongoSpy;
      try {
        const { DeletionObligation } = await import("../../src/models/DeletionObligation.js");
        mongoSpy = vi.spyOn(DeletionObligation, "findOneAndUpdate").mockRejectedValue(new Error("Mongo connection closed"));
      } catch (e) {}

      let thrownError = null;
      try {
        await recordDeletionObligation({
          type: "ACCOUNT_DELETION",
          userId: fakeUserId,
          targetCollection: "ALL",
          status: "FAILED",
          error: "Simulated error",
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError.message).toContain("CRITICAL: Failed to durably persist deletion obligation to any datastore");

      pgSpy.mockRestore();
      if (mongoSpy) mongoSpy.mockRestore();
    });

    it("F. Wrong-user document ID cannot delete data and does not resolve obligation", async () => {
      const hashed = await hashPassword("VictimPass123!");
      const victimUser = await prisma.user.create({
        data: {
          name: "Victim Chef",
          email: `victim-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
          deletionStatus: null,
        },
      });

      const attackerUser = await prisma.user.create({
        data: {
          name: "Attacker Chef",
          email: `attacker-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
          deletionStatus: null,
        },
      });

      // Victim owns this UnstructuredRecipe document
      const victimDoc = await UnstructuredRecipe.create({
        userId: victimUser.id,
        sourcePrompt: "Secret family pasta recipe",
        rawOutput: { title: "Grandma Pasta" },
        conversionStatus: "NORMALIZED",
      });

      // An obligation is maliciously or mistakenly recorded under attacker's userId pointing to victim's documentId
      const crossObligationKey = computeObligationKey({
        type: "DOCUMENT_CLEANUP",
        userId: attackerUser.id,
        targetCollection: "UnstructuredRecipe",
        documentId: String(victimDoc._id),
      });

      await recordDeletionObligation({
        type: "DOCUMENT_CLEANUP",
        userId: attackerUser.id,
        targetCollection: "UnstructuredRecipe",
        documentId: String(victimDoc._id),
        status: "PENDING",
      });

      // Run background reconciliation
      const reconResult = await reconcilePendingAccountDeletions();
      expect(reconResult.failed).toBeGreaterThanOrEqual(1);

      // 1. VICTIM'S DOCUMENT MUST SURVIVE INTACT IN MONGODB
      const docAfter = await UnstructuredRecipe.findById(victimDoc._id);
      expect(docAfter).not.toBeNull();
      expect(docAfter.userId).toBe(victimUser.id);
      expect(docAfter.rawOutput.title).toBe("Grandma Pasta");

      // 2. Both users remain active in PostgreSQL
      const victimAfter = await prisma.user.findUnique({ where: { id: victimUser.id } });
      expect(victimAfter).not.toBeNull();
      expect(victimAfter.isActive).toBe(true);

      const attackerAfter = await prisma.user.findUnique({ where: { id: attackerUser.id } });
      expect(attackerAfter).not.toBeNull();
      expect(attackerAfter.isActive).toBe(true);

      // 3. The obligation was NOT resolved as successful: status is FAILED in PostgreSQL
      const pgOb = await prisma.accountDeletionObligation.findFirst({
        where: { obligationKey: crossObligationKey },
      });
      expect(pgOb).not.toBeNull();
      expect(pgOb.status).toBe("FAILED");
      expect(pgOb.lastError).toContain("Cross-user document cleanup rejected");

      // Cleanup
      await prisma.user.deleteMany({ where: { id: { in: [victimUser.id, attackerUser.id] } } });
      await UnstructuredRecipe.deleteOne({ _id: victimDoc._id });
      await resolveDeletionObligation({ obligationKey: crossObligationKey });
    });

    it("G. Missing or invalid target fields cannot silently succeed", async () => {
      const hashed = await hashPassword("FieldPass123!");
      const user = await prisma.user.create({
        data: {
          name: "Field Test User",
          email: `field-test-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
          deletionStatus: null,
        },
      });

      // Record obligation with unsupported targetCollection
      const invalidObKey = `DOC:${user.id}:UnsupportedCollection:invalid-doc-123`;
      await prisma.accountDeletionObligation.create({
        data: {
          obligationKey: invalidObKey,
          type: "DOCUMENT_CLEANUP",
          userId: user.id,
          targetCollection: "UnsupportedCollection",
          documentId: "invalid-doc-123",
          status: "PENDING",
        },
      });

      // Run background reconciliation
      const reconResult = await reconcilePendingAccountDeletions();
      expect(reconResult.failed).toBeGreaterThanOrEqual(1);

      // The obligation was NOT deleted / resolved; it is preserved and marked FAILED
      const obAfter = await prisma.accountDeletionObligation.findFirst({
        where: { obligationKey: invalidObKey },
      });
      expect(obAfter).not.toBeNull();
      expect(obAfter.status).toBe("FAILED");
      expect(obAfter.lastError).toContain("Unsupported targetCollection");

      // User remains active and unharmed
      const userAfter = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userAfter).not.toBeNull();
      expect(userAfter.isActive).toBe(true);

      // Cleanup
      await resolveDeletionObligation({ obligationKey: invalidObKey, userId: user.id });
      await prisma.user.deleteMany({ where: { id: user.id } });
    });

    it("H. MongoDB unavailable preserves obligations for future retry", async () => {
      const hashed = await hashPassword("MongoFailPass123!");
      const user = await prisma.user.create({
        data: {
          name: "Mongo Fail User",
          email: `mongo-fail-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
          deletionStatus: null,
        },
      });

      const obKey = computeObligationKey({
        type: "DOCUMENT_CLEANUP",
        userId: user.id,
        targetCollection: "UnstructuredRecipe",
        documentId: "507f1f77bcf86cd799439011",
      });

      await prisma.accountDeletionObligation.create({
        data: {
          obligationKey: obKey,
          type: "DOCUMENT_CLEANUP",
          userId: user.id,
          targetCollection: "UnstructuredRecipe",
          documentId: "507f1f77bcf86cd799439011",
          status: "PENDING",
        },
      });

      // Temporarily simulate unconfigured / unavailable MongoDB
      const originalMongoUri = process.env.MONGO_URI;
      const originalMongoTestUri = process.env.MONGO_TEST_URI;
      delete process.env.MONGO_URI;
      delete process.env.MONGO_TEST_URI;

      let reconResult;
      try {
        reconResult = await reconcilePendingAccountDeletions();
      } finally {
        if (originalMongoUri) process.env.MONGO_URI = originalMongoUri;
        if (originalMongoTestUri) process.env.MONGO_TEST_URI = originalMongoTestUri;
      }

      expect(reconResult.failed).toBeGreaterThanOrEqual(1);

      // The obligation was NOT discarded or resolved; it survives for future retry
      const obAfter = await prisma.accountDeletionObligation.findFirst({
        where: { obligationKey: obKey },
      });
      expect(obAfter).not.toBeNull();
      expect(obAfter.status).toBe("FAILED");
      expect(obAfter.lastError).toContain("MongoDB is unconfigured");

      // Cleanup
      await resolveDeletionObligation({ obligationKey: obKey, userId: user.id });
      await prisma.user.deleteMany({ where: { id: user.id } });
    });

    it("I. Stale account marker preserves active user and clears both markers safely", async () => {
      const hashed = await hashPassword("StaleMarkerPass123!");
      const activeUser = await prisma.user.create({
        data: {
          name: "Active Chef Stale Marker",
          email: `stale-marker-${Date.now()}@pantrypal.test`,
          password: hashed,
          isActive: true,
          deletionStatus: null, // Active user with NO deletionStatus
        },
      });

      // User has real application data
      const pantry = await prisma.pantry.create({
        data: {
          name: "Active Stale Pantry",
          userId: activeUser.id,
          items: {
            create: [
              { name: "Organic Honey", quantity: 250, unit: "g" },
              { name: "Basmati Rice", quantity: 1, unit: "kg" },
            ],
          },
        },
      });

      const staleObligationKey = computeObligationKey({
        type: "ACCOUNT_DELETION",
        userId: activeUser.id,
      });

      // Insert stale ACCOUNT_DELETION obligation in PostgreSQL
      await prisma.accountDeletionObligation.create({
        data: {
          obligationKey: staleObligationKey,
          type: "ACCOUNT_DELETION",
          userId: activeUser.id,
          targetCollection: "ALL",
          status: "PENDING",
        },
      });

      // Insert stale ACCOUNT_DELETION obligation in MongoDB
      await DeletionObligation.create({
        obligationKey: staleObligationKey,
        type: "ACCOUNT_DELETION",
        userId: activeUser.id,
        targetCollection: "ALL",
        status: "PENDING",
      });

      // Run background reconciliation
      const reconResult = await reconcilePendingAccountDeletions();
      expect(reconResult.reconciled).toBeGreaterThanOrEqual(1);

      // 1. ACTIVE USER MUST NOT BE DELETED FROM POSTGRESQL
      const userInPg = await prisma.user.findUnique({
        where: { id: activeUser.id },
      });
      expect(userInPg).not.toBeNull();
      expect(userInPg.isActive).toBe(true);
      expect(userInPg.deletionStatus).toBeNull();

      // 2. Application data is completely preserved
      const pantryInPg = await prisma.pantry.findUnique({
        where: { id: pantry.id },
        include: { items: true },
      });
      expect(pantryInPg).not.toBeNull();
      expect(pantryInPg.items).toHaveLength(2);

      // 3. PostgreSQL stale marker is resolved transactionally
      const pgMarkerAfter = await prisma.accountDeletionObligation.findFirst({
        where: { obligationKey: staleObligationKey },
      });
      expect(pgMarkerAfter).toBeNull();

      // 4. MongoDB stale marker is resolved post-commit
      const mongoMarkerAfter = await DeletionObligation.findOne({
        obligationKey: staleObligationKey,
      });
      expect(mongoMarkerAfter).toBeNull();

      // 5. Subsequent reconciliation runs DO NOT rediscover or loop on this user
      const secondRunResult = await reconcilePendingAccountDeletions();
      expect(secondRunResult.reconciled).toBe(0);
      expect(secondRunResult.failed).toBe(0);

      // User remains active and healthy
      const userStillActive = await prisma.user.findUnique({ where: { id: activeUser.id } });
      expect(userStillActive).not.toBeNull();
      expect(userStillActive.isActive).toBe(true);

      // Cleanup
      await prisma.pantryItem.deleteMany({ where: { pantryId: pantry.id } });
      await prisma.pantry.deleteMany({ where: { userId: activeUser.id } });
      await prisma.user.deleteMany({ where: { id: activeUser.id } });
    });

    it("J. Sensitive error logging: dual-datastore obligation-write failures redact raw database credentials", async () => {
      const fakeUserId = `secret-cred-${Date.now()}`;
      const sensitivePgError =
        "FATAL: password authentication failed for user 'postgres' at postgresql://postgres:SuperSecretDatabasePassword999@db.internal.pantrypal.com:5432/pantrypal?password=SuperSecretDatabasePassword999";
      const sensitiveMongoError =
        "MongoServerSelectionError: connection refused at mongodb://root:MongoTopSecretKey456@cluster0.pantrypal.mongodb.net:27017/pantrypal?auth=MongoTopSecretKey456";

      // Mock both datastores to throw sensitive error messages
      const pgSpy = vi.spyOn(prisma.accountDeletionObligation, "upsert").mockRejectedValue(new Error(sensitivePgError));

      let mongoSpy;
      try {
        const { DeletionObligation } = await import("../../src/models/DeletionObligation.js");
        mongoSpy = vi.spyOn(DeletionObligation, "findOneAndUpdate").mockRejectedValue(new Error(sensitiveMongoError));
      } catch (e) {}

      let thrownError = null;
      try {
        await recordDeletionObligation({
          type: "ACCOUNT_DELETION",
          userId: fakeUserId,
          targetCollection: "ALL",
          status: "FAILED",
          error: "Simulated sensitive error",
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      // Crucial assertion: credentials MUST NOT appear anywhere in the error message
      expect(thrownError.message).not.toContain("SuperSecretDatabasePassword999");
      expect(thrownError.message).not.toContain("MongoTopSecretKey456");

      // Redacted placeholders MUST appear
      expect(thrownError.message).toContain("******");

      pgSpy.mockRestore();
      if (mongoSpy) mongoSpy.mockRestore();
    });
  });
});
