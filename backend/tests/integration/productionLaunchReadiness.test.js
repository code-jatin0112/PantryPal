import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { connectMongo, disconnectMongo } from "../../src/config/mongo.js";
import mongoose from "mongoose";
import { generateAccessToken } from "../../src/utils/token.js";

describe("Phase 7 Production Launch Readiness Suite", () => {
  beforeAll(async () => {
    await connectMongo();
  });

  afterAll(async () => {
    await disconnectMongo();
    await prisma.$disconnect();
  });

  describe("1. Health & Liveness Probes", () => {
    it("returns HTTP 200 healthy on GET /api/v1/health", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("healthy");
      expect(res.body.data.timestamp).toBeDefined();
    });

    it("returns HTTP 200 healthy on GET /api/v1/health/liveness", async () => {
      const res = await request(app).get("/api/v1/health/liveness");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("healthy");
    });
  });

  describe("2. Deep Readiness Probe (PostgreSQL & MongoDB)", () => {
    it("returns HTTP 200 ready when both PostgreSQL and MongoDB are healthy", async () => {
      const res = await request(app).get("/api/v1/health/readiness");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ready");
      expect(res.body.data.services.postgres).toBe("connected");
      expect(res.body.data.services.mongodb).toBe("connected");
    });

    it("returns HTTP 200 ready on GET /api/v1/health/ready alias", async () => {
      const res = await request(app).get("/api/v1/health/ready");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ready");
    });

    it("returns HTTP 503 unhealthy when PostgreSQL connectivity check fails", async () => {
      const pgSpy = vi
        .spyOn(prisma, "$queryRawUnsafe")
        .mockRejectedValueOnce(new Error("Connection to database server lost at postgresql://postgres:secret@localhost:5432/pantrypal"));

      const res = await request(app).get("/api/v1/health/readiness");
      pgSpy.mockRestore();

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe("unhealthy");
      expect(res.body.data.services.postgres).toBe("disconnected");
      expect(res.body.data.services.mongodb).toBe("connected");

      // Verify zero credentials or connection strings leaked in payload
      const payloadString = JSON.stringify(res.body);
      expect(payloadString).not.toContain("secret");
      expect(payloadString).not.toContain("5432");
      expect(payloadString).not.toContain("postgresql://");
    });

    it("returns HTTP 503 unhealthy when MongoDB ping fails", async () => {
      const pingSpy = vi
        .spyOn(mongoose.connection.db, "command")
        .mockRejectedValueOnce(new Error("MongoServerSelectionError: cluster unavailable at mongodb://user:pass@cluster.mongodb.net/test"));

      const res = await request(app).get("/api/v1/health/readiness");
      pingSpy.mockRestore();

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe("unhealthy");
      expect(res.body.data.services.postgres).toBe("connected");
      expect(res.body.data.services.mongodb).toBe("disconnected");

      // Verify zero credentials or connection strings leaked in payload
      const payloadString = JSON.stringify(res.body);
      expect(payloadString).not.toContain("pass");
      expect(payloadString).not.toContain("mongodb.net");
      expect(payloadString).not.toContain("mongodb://");
    });
  });

  describe("3. Production Security & Token Validation", () => {
    it("rejects weak or placeholder JWT_SECRET in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;

      try {
        process.env.NODE_ENV = "production";

        // Placeholder secret
        process.env.JWT_SECRET = "your-super-secret-jwt-key-here-that-is-long-enough-32-chars";
        expect(() => generateAccessToken("test-user-id")).toThrow(
          /CRITICAL SECURITY CONFIGURATION ERROR/
        );

        // Short secret (< 32 chars)
        process.env.JWT_SECRET = "too-short-secret";
        expect(() => generateAccessToken("test-user-id")).toThrow(
          /CRITICAL SECURITY CONFIGURATION ERROR/
        );

        // Valid high-entropy 32+ char secret
        process.env.JWT_SECRET = "a-very-secure-randomly-generated-production-jwt-secret-key-32";
        const token = generateAccessToken("test-user-id");
        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.JWT_SECRET = originalSecret;
      }
    });
  });
});
