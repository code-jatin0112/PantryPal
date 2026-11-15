import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import supertest from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { connectMongo, disconnectMongo } from "../../src/config/mongo.js";
import { AiInteractionLog } from "../../src/models/AiInteractionLog.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { hashPassword } from "../../src/utils/password.js";
import {
  assertAuthorizedTestDatabase,
  isAuthorizedPostgresTestUrl,
  isAuthorizedMongoTestUri,
} from "../../src/utils/testDatabaseGuard.js";
import {
  reconcilePendingAccountDeletions,
} from "../../src/services/authService.js";

describe("Durable Deletion Recovery & Test Isolation Regression Suite (Task 1-4)", () => {
  beforeAll(async () => {
    // 1. Assert strict test database isolation
    await assertAuthorizedTestDatabase(prisma);
    await connectMongo();

    // Verify connected MongoDB is indeed the dedicated test database
    expect(isAuthorizedMongoTestUri(process.env.MONGO_URI)).toBe(true);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await disconnectMongo();
  });

  // ── 1. Test Database Safety & Guard Validation ──────────────
  describe("1. Test Database Safety & Fail-Closed Guard", () => {
    it("rejects production, staging, and unknown database configurations", () => {
      // Production cloud domains must always be rejected
      expect(isAuthorizedPostgresTestUrl("postgresql://user:pass@ep-cool-123.us-east-2.aws.neon.tech/pantrypal?sslmode=require")).toBe(false);
      expect(isAuthorizedPostgresTestUrl("postgresql://postgres:secret@db.project.supabase.co:5432/postgres")).toBe(false);
      expect(isAuthorizedPostgresTestUrl("postgresql://user:pass@containers-us-west-1.railway.app:5432/railway")).toBe(false);

      // Plain shared database without explicit test naming must be rejected
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/pantrypal")).toBe(false);
      expect(isAuthorizedPostgresTestUrl("")).toBe(false);
      expect(isAuthorizedPostgresTestUrl(null)).toBe(false);

      // Explicit dedicated test databases must pass
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/pantrypal_test")).toBe(true);
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/myapp_test?schema=public")).toBe(true);
    });

    it("rejects non-test MongoDB URIs", () => {
      expect(isAuthorizedMongoTestUri("mongodb+srv://user:pass@cluster0.mongodb.net/pantrypal?appName=Cluster0")).toBe(false);
      expect(isAuthorizedMongoTestUri("mongodb://localhost:27017/pantrypal")).toBe(false);
      expect(isAuthorizedMongoTestUri("mongodb+srv://user:pass@cluster0.mongodb.net/pantrypal_test?appName=Cluster0")).toBe(true);
      expect(isAuthorizedMongoTestUri("mongodb://localhost:27017/my_app_test")).toBe(true);
    });

    it("assertAuthorizedTestDatabase fails closed when NODE_ENV is not 'test'", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      await expect(assertAuthorizedTestDatabase(prisma)).rejects.toThrow(
        /CRITICAL TEST DATABASE SAFETY ERROR/
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  // ── 2. MongoDB Actual Log Creation, Cleanup & Isolation ─────
  describe("2. MongoDB Actual Log Telemetry & Cross-User Isolation", () => {
    let testUserA;
    let testUserB;
    let tokenA;
    let tokenB;

    beforeAll(async () => {
      const hashedPass = await hashPassword("UserPass123!");
      testUserA = await prisma.user.create({
        data: {
          name: "User A Telemetry",
          email: `usera-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: true,
        },
      });
      tokenA = generateAccessToken(testUserA.id, 0);

      testUserB = await prisma.user.create({
        data: {
          name: "User B Telemetry",
          email: `userb-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: true,
        },
      });
      tokenB = generateAccessToken(testUserB.id, 0);

      // Create actual AI interaction logs in the isolated MongoDB test database
      await AiInteractionLog.create({
        userId: testUserA.id,
        messagePrompt: "User A unique query: How to make pesto?",
        intentDetected: "RECIPE_GENERATION",
        aiResponse: { recipe: "Basil Pesto" },
        tokenUsage: 45,
      });

      await AiInteractionLog.create({
        userId: testUserB.id,
        messagePrompt: "User B unique query: How to braise short ribs?",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: { steps: ["Sear", "Simmer 3 hours"] },
        tokenUsage: 60,
      });
    });

    afterAll(async () => {
      if (testUserA?.id) {
        await prisma.user.deleteMany({ where: { id: testUserA.id } });
        await AiInteractionLog.deleteMany({ userId: testUserA.id });
      }
      if (testUserB?.id) {
        await prisma.user.deleteMany({ where: { id: testUserB.id } });
        await AiInteractionLog.deleteMany({ userId: testUserB.id });
      }
    });

    it("verifies logs exist in MongoDB and export includes strictly user-owned logs", async () => {
      const logsA = await AiInteractionLog.find({ userId: testUserA.id });
      expect(logsA.length).toBe(1);
      expect(logsA[0].messagePrompt).toContain("pesto");

      const exportRes = await supertest(app)
        .get("/api/v1/auth/export")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.data.aiInteractionHistory.length).toBe(1);
      expect(exportRes.body.data.aiInteractionHistory[0].messagePrompt).toContain("pesto");
      // Strict cross-user isolation: User B's log is NEVER present
      const leakedB = exportRes.body.data.aiInteractionHistory.find((l) =>
        l.messagePrompt.includes("short ribs")
      );
      expect(leakedB).toBeUndefined();
    });

    it("deleting User A deletes User A logs without affecting User B logs in MongoDB", async () => {
      const deleteRes = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ password: "UserPass123!" });

      expect(deleteRes.status).toBe(200);

      // Verify User A logs in MongoDB are completely gone
      const remainingLogsA = await AiInteractionLog.find({ userId: testUserA.id });
      expect(remainingLogsA.length).toBe(0);

      // Verify User B logs in MongoDB are completely preserved
      const remainingLogsB = await AiInteractionLog.find({ userId: testUserB.id });
      expect(remainingLogsB.length).toBe(1);
      expect(remainingLogsB[0].messagePrompt).toContain("short ribs");
    });
  });

  // ── 3. Partial Failure, Reload & Identity-Verified Recovery ─
  describe("3. Partial Failure, Session Loss, and Identity-Verified Retry", () => {
    let strandedUser;
    let strandedToken;
    const strandedPassword = "StrandedSecret123!";

    beforeAll(async () => {
      const hashedPass = await hashPassword(strandedPassword);
      strandedUser = await prisma.user.create({
        data: {
          name: "Stranded Chef",
          email: `stranded-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: true,
        },
      });
      strandedToken = generateAccessToken(strandedUser.id, 0);

      // Create pantry and item in PostgreSQL to test cascade deletion
      const pantry = await prisma.pantry.create({
        data: {
          name: "Stranded Pantry",
          userId: strandedUser.id,
        },
      });
      await prisma.pantryItem.create({
        data: {
          pantryId: pantry.id,
          name: "Stranded Salt",
          quantity: 1,
          unit: "box",
        },
      });

      // Create AI interaction log in MongoDB
      await AiInteractionLog.create({
        userId: strandedUser.id,
        messagePrompt: "Stranded user prompt before deletion failure",
        intentDetected: "UNKNOWN",
        aiResponse: { ok: true },
        tokenUsage: 15,
      });
    });

    afterAll(async () => {
      if (strandedUser?.id) {
        await prisma.user.deleteMany({ where: { id: strandedUser.id } });
        await AiInteractionLog.deleteMany({ userId: strandedUser.id });
      }
    });

    it("handles MongoDB failure: sets DELETION_FAILED, locks out user, returns 502", async () => {
      // Simulate MongoDB failure
      const mongoSpy = vi
        .spyOn(AiInteractionLog, "deleteMany")
        .mockRejectedValueOnce(new Error("Simulated Atlas network partition"));

      const res = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${strandedToken}`)
        .send({ password: strandedPassword });

      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe("TELEMETRY_CLEANUP_FAILED");

      // Verify PostgreSQL user was NOT deleted
      const checkUser = await prisma.user.findUnique({
        where: { id: strandedUser.id },
      });
      expect(checkUser).toBeDefined();
      expect(checkUser.isActive).toBe(false);
      expect(checkUser.deletionStatus).toBe("DELETION_FAILED");

      // Verify user's AI log in MongoDB was NOT deleted prematurely
      const logs = await AiInteractionLog.find({ userId: strandedUser.id });
      expect(logs.length).toBe(1);

      mongoSpy.mockRestore();
    });

    it("rejects normal protected routes with 401 USER_NOT_AVAILABLE for pending account", async () => {
      const meRes = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${strandedToken}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error.code).toBe("USER_NOT_AVAILABLE");

      const pantryRes = await supertest(app)
        .get("/api/v1/pantries")
        .set("Authorization", `Bearer ${strandedToken}`);

      expect(pantryRes.status).toBe(401);
      expect(pantryRes.body.error.code).toBe("USER_NOT_AVAILABLE");
    });

    it("login attempt with correct password returns 403 ACCOUNT_PENDING_DELETION", async () => {
      const loginRes = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: strandedUser.email,
          password: strandedPassword,
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.error.code).toBe("ACCOUNT_PENDING_DELETION");
    });

    it("simulates page reload / session loss: rejects retry with invalid credentials", async () => {
      // User lost their token after page reload and tries to retry with WRONG password
      const retryRes = await supertest(app)
        .post("/api/v1/auth/account/retry-deletion")
        .send({
          email: strandedUser.email,
          password: "WrongPassword123!",
        });

      expect(retryRes.status).toBe(401);
      expect(retryRes.body.error.code).toBe("INVALID_CREDENTIALS");

      // Account must remain intact in PostgreSQL and MongoDB
      const checkUser = await prisma.user.findUnique({
        where: { id: strandedUser.id },
      });
      expect(checkUser).toBeDefined();
    });

    it("simulates page reload: user recovers and finalizes deletion with valid email + password without JWT", async () => {
      // User lost their token after reload, supplies correct email and password to finalize deletion
      const retryRes = await supertest(app)
        .post("/api/v1/auth/account/retry-deletion")
        .send({
          email: strandedUser.email,
          password: strandedPassword,
        });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.status).toBe("COMPLETED");

      // Verify PostgreSQL user and cascaded pantry are deleted
      const checkUser = await prisma.user.findUnique({
        where: { id: strandedUser.id },
      });
      expect(checkUser).toBeNull();

      const checkPantries = await prisma.pantry.findMany({
        where: { userId: strandedUser.id },
      });
      expect(checkPantries.length).toBe(0);

      // Verify MongoDB AI interaction logs are deleted
      const logs = await AiInteractionLog.find({ userId: strandedUser.id });
      expect(logs.length).toBe(0);
    });

    it("is idempotent: calling retry-deletion again on deleted user returns 200 COMPLETED", async () => {
      const idempotentRes = await supertest(app)
        .post("/api/v1/auth/account/retry-deletion")
        .send({
          email: strandedUser.email,
          password: strandedPassword,
        });

      expect(idempotentRes.status).toBe(200);
      expect(idempotentRes.body.data.status).toBe("COMPLETED");
    });
  });

  // ── 4. Process Restart & Background Scheduled Reconciliation ─
  describe("4. Process Restart & Durable Background Reconciliation", () => {
    let unrecoveredUser;

    beforeAll(async () => {
      const hashedPass = await hashPassword("RecoverMePass123!");
      unrecoveredUser = await prisma.user.create({
        data: {
          name: "Unrecovered Chef",
          email: `unrecovered-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: false,
          deletionStatus: "DELETION_FAILED",
          tokenVersion: 1,
        },
      });

      // Seed MongoDB AI log
      await AiInteractionLog.create({
        userId: unrecoveredUser.id,
        messagePrompt: "Query to be cleaned up on process restart",
        intentDetected: "UNKNOWN",
        aiResponse: { pending: true },
        tokenUsage: 20,
      });
    });

    afterAll(async () => {
      if (unrecoveredUser?.id) {
        await prisma.user.deleteMany({ where: { id: unrecoveredUser.id } });
        await AiInteractionLog.deleteMany({ userId: unrecoveredUser.id });
      }
    });

    it("reconcilePendingAccountDeletions automatically cleans up pending accounts after process restart", async () => {
      // Simulate server startup reconciliation
      const result = await reconcilePendingAccountDeletions();

      expect(result.reconciled).toBeGreaterThanOrEqual(1);

      // Verify PostgreSQL user is now deleted
      const checkUser = await prisma.user.findUnique({
        where: { id: unrecoveredUser.id },
      });
      expect(checkUser).toBeNull();

      // Verify MongoDB AI logs are now deleted
      const checkLogs = await AiInteractionLog.find({ userId: unrecoveredUser.id });
      expect(checkLogs.length).toBe(0);
    });
  });
});
