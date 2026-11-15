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
  sanitizeDatabaseUrl,
  APPROVED_TEST_DB_NAME,
} from "../../src/utils/testDatabaseGuard.js";
import {
  retryAccountDeletion,
  reconcilePendingAccountDeletions,
} from "../../src/services/authService.js";

describe("Durable Deletion Recovery & Strict Test Isolation Suite", () => {
  beforeAll(async () => {
    // 1. Assert strict test database isolation
    await assertAuthorizedTestDatabase(prisma);
    await connectMongo();

    // Verify connected MongoDB is indeed the dedicated test database
    expect(isAuthorizedMongoTestUri(process.env.MONGO_TEST_URI)).toBe(true);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await disconnectMongo();
  });

  // ── 1. Strict Test Database Isolation & Fail-Closed Guard ────
  describe("1. Strict Test Database Isolation & Secret Redaction", () => {
    it("denies production, cloud, and unapproved database host URLs", () => {
      // Production cloud domains must always be rejected
      expect(
        isAuthorizedPostgresTestUrl(
          "postgresql://user:pass@ep-cool-123.us-east-2.aws.neon.tech/pantrypal_test?sslmode=require"
        )
      ).toBe(false);
      expect(
        isAuthorizedPostgresTestUrl(
          "postgresql://postgres:secret@db.project.supabase.co:5432/pantrypal_test"
        )
      ).toBe(false);
      expect(
        isAuthorizedPostgresTestUrl(
          "postgresql://user:pass@containers-us-west-1.railway.app:5432/pantrypal_test"
        )
      ).toBe(false);
      expect(
        isAuthorizedPostgresTestUrl(
          "postgresql://external-host.example.com:5432/pantrypal_test"
        )
      ).toBe(false);

      // Plain shared database without exact test database name must be rejected
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/pantrypal")).toBe(false);
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/pantrypal_dev")).toBe(false);
      // Arbitrary substring containing "test" must be rejected (must be EXACT pantrypal_test)
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/some_other_test")).toBe(false);
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/test_pantrypal")).toBe(false);

      // Exact approved test database on localhost / 127.0.0.1 must pass
      expect(isAuthorizedPostgresTestUrl("postgresql://localhost:5432/pantrypal_test")).toBe(true);
      expect(isAuthorizedPostgresTestUrl("postgresql://127.0.0.1:5432/pantrypal_test?schema=public")).toBe(true);
    });

    it("denies unapproved MongoDB URIs and requires exact pantrypal_test on approved hosts", () => {
      // Atlas / cloud domains must be rejected for test runner
      expect(
        isAuthorizedMongoTestUri(
          "mongodb+srv://user:pass@cluster0.mongodb.net/pantrypal_test?appName=Cluster0"
        )
      ).toBe(false);
      expect(isAuthorizedMongoTestUri("mongodb://localhost:27017/pantrypal")).toBe(false);
      expect(isAuthorizedMongoTestUri("mongodb://localhost:27017/random_test")).toBe(false);

      // Exact approved test database on localhost must pass
      expect(isAuthorizedMongoTestUri("mongodb://localhost:27017/pantrypal_test")).toBe(true);
      expect(isAuthorizedMongoTestUri("mongodb://127.0.0.1:27017/pantrypal_test")).toBe(true);
    });

    it("assertAuthorizedTestDatabase fails closed when TEST_DATABASE_URL or MONGO_TEST_URI is missing (never falls back silently)", async () => {
      const origPostgres = process.env.TEST_DATABASE_URL;
      const origMongo = process.env.MONGO_TEST_URI;

      try {
        delete process.env.TEST_DATABASE_URL;
        await expect(assertAuthorizedTestDatabase(prisma)).rejects.toThrow(
          /TEST_DATABASE_URL must be explicitly configured in the test environment\. Implicit fallbacks are disabled\./
        );

        process.env.TEST_DATABASE_URL = origPostgres;
        delete process.env.MONGO_TEST_URI;
        await expect(assertAuthorizedTestDatabase(prisma)).rejects.toThrow(
          /MONGO_TEST_URI must be explicitly configured in the test environment\. Implicit fallbacks are disabled\./
        );
      } finally {
        process.env.TEST_DATABASE_URL = origPostgres;
        process.env.MONGO_TEST_URI = origMongo;
      }
    });

    it("redacts credentials from error messages and logs", async () => {
      const urlWithSecret = "postgresql://secretUser:superSecretPassword123@remotehost:5432/pantrypal_test";
      const sanitized = sanitizeDatabaseUrl(urlWithSecret);

      expect(sanitized).not.toContain("superSecretPassword123");
      expect(sanitized).not.toContain("secretUser");
      expect(sanitized).toContain("******:******");

      const origPostgres = process.env.TEST_DATABASE_URL;
      try {
        process.env.TEST_DATABASE_URL = urlWithSecret;
        let thrownError = null;
        try {
          await assertAuthorizedTestDatabase(prisma);
        } catch (err) {
          thrownError = err;
        }

        expect(thrownError).toBeDefined();
        expect(thrownError.message).not.toContain("superSecretPassword123");
        expect(thrownError.message).not.toContain("secretUser");
        expect(thrownError.message).toContain("******:******");
      } finally {
        process.env.TEST_DATABASE_URL = origPostgres;
      }
    });
  });

  // ── 2. Deletion Recovery Authorization & Active Account Guard
  describe("2. Deletion Recovery Authorization & Active Account Guard", () => {
    let activeUser;
    const activeUserPassword = "ActiveUserPass123!";

    beforeAll(async () => {
      const hashedPass = await hashPassword(activeUserPassword);
      activeUser = await prisma.user.create({
        data: {
          name: "Active Chef Guard Test",
          email: `active-guard-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: true,
          tokenVersion: 0,
          deletionStatus: null,
          pantries: {
            create: {
              name: "Active Chef Kitchen",
            },
          },
        },
      });
    });

    it("retry cannot delete an active account: returns 400 and alters zero user data", async () => {
      // Normal active account calls retry-deletion with valid credentials
      const res = await supertest(app)
        .post("/api/v1/auth/account/retry-deletion")
        .send({
          email: activeUser.email,
          password: activeUserPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ACCOUNT_NOT_PENDING_DELETION");

      // Verify active user is completely untouched
      const freshUser = await prisma.user.findUnique({
        where: { id: activeUser.id },
        include: { pantries: true },
      });

      expect(freshUser).toBeDefined();
      expect(freshUser.isActive).toBe(true);
      expect(freshUser.tokenVersion).toBe(0);
      expect(freshUser.deletionStatus).toBeNull();
      expect(freshUser.pantries.length).toBe(1);
    });

    it("incorrect credentials cannot finalize deletion: wrong password returns 401 INVALID_CREDENTIALS", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/account/retry-deletion")
        .send({
          email: activeUser.email,
          password: "CompletelyWrongPassword!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("non-existent account returns 401 INVALID_CREDENTIALS without revealing account existence", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/account/retry-deletion")
        .send({
          email: `non-existent-${Date.now()}@pantrypal.test`,
          password: "SomePassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  // ── 3. Partial Failure, Session Loss, and Identity-Verified Retry ─
  describe("3. Partial Failure, Session Loss, and Identity-Verified Retry", () => {
    let strandedUser;
    let strandedToken;
    const strandedPassword = "StrandedPassword123!";

    beforeAll(async () => {
      const hashedPass = await hashPassword(strandedPassword);
      strandedUser = await prisma.user.create({
        data: {
          name: "Stranded Chef Recovery",
          email: `stranded-${Date.now()}@pantrypal.test`,
          password: hashedPass,
          isActive: true,
          pantries: {
            create: {
              name: "Stranded Pantry",
            },
          },
        },
      });

      strandedToken = generateAccessToken(strandedUser.id, 0);

      // Create an AI interaction log in MongoDB
      await AiInteractionLog.create({
        userId: strandedUser.id,
        messagePrompt: "How do I make beef bourguignon?",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: "Here is the recipe...",
        tokenUsage: 100,
      });
    });

    it("handles MongoDB failure: sets DELETION_FAILED, locks out user, returns 502", async () => {
      // Simulate MongoDB network partition
      vi.spyOn(AiInteractionLog, "deleteMany").mockRejectedValueOnce(
        new Error("Simulated Atlas network partition")
      );

      const delRes = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${strandedToken}`)
        .send({ password: strandedPassword });

      expect(delRes.status).toBe(502);
      expect(delRes.body.error.code).toBe("TELEMETRY_CLEANUP_FAILED");

      // Verify user state: locked out in PostgreSQL
      const userInDb = await prisma.user.findUnique({
        where: { id: strandedUser.id },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb.isActive).toBe(false);
      expect(["PENDING_DELETION", "DELETION_FAILED"]).toContain(userInDb.deletionStatus);
      expect(userInDb.tokenVersion).toBe(1);

      // MongoDB telemetry record must still exist
      const remainingLogs = await AiInteractionLog.find({ userId: strandedUser.id });
      expect(remainingLogs.length).toBe(1);
    });

    it("rejects normal protected routes with 401 USER_NOT_AVAILABLE for pending account", async () => {
      const profileRes = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${strandedToken}`);

      expect(profileRes.status).toBe(401);
      expect(profileRes.body.error.code).toBe("USER_NOT_AVAILABLE");
    });

    it("login attempt returns 403 ACCOUNT_PENDING_DELETION", async () => {
      const loginRes = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: strandedUser.email,
          password: strandedPassword,
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.error.code).toBe("ACCOUNT_PENDING_DELETION");
    });

    it("pending deletion can be retried after session loss with verified credentials", async () => {
      // User lost their token after session loss / page reload
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

      // Verify MongoDB AI interaction logs are purged
      const logs = await AiInteractionLog.find({ userId: strandedUser.id });
      expect(logs.length).toBe(0);
    });
  });

  // ── 4. Telemetry Isolation & Existing Deletion / Export Flows ─
  describe("4. Actual MongoDB & PostgreSQL Isolation and Export Flow", () => {
    let userA;
    let userB;
    let tokenA;
    let tokenB;
    const passwordA = "UserAPassword123!";

    beforeAll(async () => {
      const hashedA = await hashPassword(passwordA);
      const hashedB = await hashPassword("UserBPassword123!");

      userA = await prisma.user.create({
        data: {
          name: "User A Iso",
          email: `usera-iso-${Date.now()}@pantrypal.test`,
          password: hashedA,
          isActive: true,
          pantries: { create: { name: "Pantry A" } },
        },
      });
      tokenA = generateAccessToken(userA.id, 0);

      userB = await prisma.user.create({
        data: {
          name: "User B Iso",
          email: `userb-iso-${Date.now()}@pantrypal.test`,
          password: hashedB,
          isActive: true,
          pantries: { create: { name: "Pantry B" } },
        },
      });
      tokenB = generateAccessToken(userB.id, 0);

      // Create logs for both users
      await AiInteractionLog.create([
        {
          userId: userA.id,
          messagePrompt: "Recipe for User A",
          intentDetected: "RECIPE_GENERATION",
          aiResponse: "Pancakes recipe",
          tokenUsage: 50,
        },
        {
          userId: userB.id,
          messagePrompt: "Recipe for User B",
          intentDetected: "RECIPE_GENERATION",
          aiResponse: "Waffles recipe",
          tokenUsage: 60,
        },
      ]);
    });

    it("existing export flow includes owned AI logs and excludes other users", async () => {
      const exportRes = await supertest(app)
        .get("/api/v1/auth/export")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.data.account.id).toBe(userA.id);
      expect(exportRes.body.data.aiInteractionHistory).toBeDefined();
      expect(exportRes.body.data.aiInteractionHistory.length).toBe(1);
      expect(exportRes.body.data.aiInteractionHistory[0].messagePrompt).toBe("Recipe for User A");
    });

    it("existing normal deletion succeeds and maintains tenant boundaries", async () => {
      const delRes = await supertest(app)
        .delete("/api/v1/auth/account")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ password: passwordA });

      expect(delRes.status).toBe(200);

      // User A is gone
      const checkA = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(checkA).toBeNull();
      const logsA = await AiInteractionLog.find({ userId: userA.id });
      expect(logsA.length).toBe(0);

      // User B is completely untouched
      const checkB = await prisma.user.findUnique({ where: { id: userB.id } });
      expect(checkB).toBeDefined();
      const logsB = await AiInteractionLog.find({ userId: userB.id });
      expect(logsB.length).toBe(1);
    });

    it("background reconciliation automatically recovers orphaned pending deletions across process restarts", async () => {
      const orphanHashed = await hashPassword("OrphanPass123!");
      const orphan = await prisma.user.create({
        data: {
          name: "Orphaned Pending User",
          email: `orphan-${Date.now()}@pantrypal.test`,
          password: orphanHashed,
          isActive: false,
          deletionStatus: "PENDING_DELETION",
          tokenVersion: 1,
        },
      });

      await AiInteractionLog.create({
        userId: orphan.id,
        messagePrompt: "Orphaned message",
        intentDetected: "KITCHEN_ASSISTANT",
        aiResponse: "Orphaned response",
        tokenUsage: 10,
      });

      // Run background boot reconciliation
      const result = await reconcilePendingAccountDeletions();
      expect(result.reconciled).toBeGreaterThanOrEqual(1);

      // Verify orphan was purged from both Postgres and Mongo
      const checkOrphan = await prisma.user.findUnique({ where: { id: orphan.id } });
      expect(checkOrphan).toBeNull();

      const orphanLogs = await AiInteractionLog.find({ userId: orphan.id });
      expect(orphanLogs.length).toBe(0);
    });
  });
});
