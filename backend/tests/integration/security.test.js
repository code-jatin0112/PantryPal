import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import express from "express";
import app from "../../src/app.js";
import {
  helmetConfig,
  getCorsOptions,
  getRateLimiter,
} from "../../src/config/security.js";
import { notFoundHandler } from "../../src/middleware/notFoundHandler.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";

describe("Security Hardening (Phase 6) Integration Tests", () => {
  describe("1. Helmet Security Headers", () => {
    it("sets secure HTTP headers on responses", async () => {
      const res = await supertest(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
      expect(res.headers["referrer-policy"]).toBe(
        "strict-origin-when-cross-origin"
      );
      expect(res.headers["content-security-policy"]).toBeDefined();
    });

    it("hides X-Powered-By header", async () => {
      const res = await supertest(app).get("/api/v1/health");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  });

  describe("2. CORS Whitelisting & Preflight", () => {
    it("allows requests from whitelisted origins", async () => {
      const res = await supertest(app)
        .get("/api/v1/health")
        .set("Origin", "http://localhost:3000");

      expect(res.status).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("allows requests with no Origin header (e.g. mobile apps, curl)", async () => {
      const res = await supertest(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("handles OPTIONS preflight requests successfully", async () => {
      const res = await supertest(app)
        .options("/api/v1/health")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");

      expect([200, 204]).toContain(res.status);
      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
    });

    it("rejects unauthorized origins with 403 and standard JSON error", async () => {
      const res = await supertest(app)
        .get("/api/v1/health")
        .set("Origin", "http://malicious-site.com");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CORS_ORIGIN_NOT_ALLOWED");
      expect(res.body.error.message).toBe("Origin not allowed by CORS policy");
    });
  });

  describe("3. Rate Limiting", () => {
    it("returns standard RateLimit headers on requests", async () => {
      const res = await supertest(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.headers["ratelimit-limit"]).toBeDefined();
      expect(res.headers["ratelimit-remaining"]).toBeDefined();
      expect(res.headers["ratelimit-reset"]).toBeDefined();
    });

    it("blocks requests and returns 429 when rate limit is exceeded", async () => {
      // Create isolated test express app with 2-request limit
      const testApp = express();
      testApp.use(
        getRateLimiter({
          windowMs: 60 * 1000,
          max: 2,
        })
      );
      testApp.get("/test", (req, res) => res.json({ success: true }));

      // Request 1: OK
      const res1 = await supertest(testApp).get("/test");
      expect(res1.status).toBe(200);

      // Request 2: OK
      const res2 = await supertest(testApp).get("/test");
      expect(res2.status).toBe(200);

      // Request 3: Blocked (429)
      const res3 = await supertest(testApp).get("/test");
      expect(res3.status).toBe(429);
      expect(res3.body.success).toBe(false);
      expect(res3.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(res3.body.error.message).toContain("Too many requests");
    });
  });

  describe("4. 404 Route Not Found Handler", () => {
    it("returns 404 JSON response for non-existent routes", async () => {
      const res = await supertest(app).get("/api/v1/non-existent-endpoint");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
      expect(res.body.error.message).toContain("/api/v1/non-existent-endpoint");
    });
  });
});

