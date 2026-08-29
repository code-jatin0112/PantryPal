import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import { generateAccessToken, verifyAccessToken } from "../../src/utils/token.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

describe("Authentication API Integration Tests (Sprint 2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Registration (POST /api/v1/auth/register)", () => {
    it("successfully registers a new user with valid email and password", async () => {
      const mockCreatedUser = {
        id: "user-uuid-101",
        name: "Chef Mario",
        email: "mario@pantrypal.test",
        password: "$2b$12$e8xL4k0ZqUv8r/mockHashedPassword123456",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
      const createSpy = vi
        .spyOn(prisma.user, "create")
        .mockResolvedValue(mockCreatedUser);

      const res = await supertest(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Chef Mario",
          email: "mario@pantrypal.test",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe("user-uuid-101");
      expect(res.body.data.user.name).toBe("Chef Mario");
      expect(res.body.data.user.email).toBe("mario@pantrypal.test");
      expect(res.body.data.accessToken).toBeDefined();

      // Ensure password is never exposed in response
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.password).toBeUndefined();

      // Verify password was hashed before create
      expect(createSpy).toHaveBeenCalledTimes(1);
      const createArgs = createSpy.mock.calls[0][0].data;
      expect(createArgs.password).not.toBe("SecurePassword123!");
      expect(createArgs.password.startsWith("$2b$")).toBe(true);
    });

    it("trims name and normalizes email before persistence", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
      const createSpy = vi.spyOn(prisma.user, "create").mockResolvedValue({
        id: "user-uuid-102",
        name: "Luigi",
        email: "luigi@pantrypal.test",
        password: "$2b$12$hashedPassword",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await supertest(app)
        .post("/api/v1/auth/register")
        .send({
          name: "   Luigi   ",
          email: "  Luigi@PantryPal.TEST  ",
          password: "Password12345",
        });

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Luigi",
            email: "luigi@pantrypal.test",
          }),
        })
      );
    });

    it("fails with 409 EMAIL_ALREADY_EXISTS when email already exists", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "existing-user-uuid",
        email: "existing@pantrypal.test",
      });

      const res = await supertest(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Duplicate User",
          email: "existing@pantrypal.test",
          password: "Password12345",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
      expect(res.body.error.message).toContain("already exists");
    });

    it("fails with 400 VALIDATION_ERROR on invalid email format", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Invalid Email",
          email: "not-an-email",
          password: "Password12345",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d) => d.field === "email")).toBe(true);
    });

    it("fails with 400 VALIDATION_ERROR when password is shorter than 8 characters", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Short Pass",
          email: "short@pantrypal.test",
          password: "1234567",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d) => d.field === "password")).toBe(true);
    });

    it("fails with 400 VALIDATION_ERROR when required fields are missing", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/register")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
    });

    it("fails with 400 VALIDATION_ERROR when name exceeds 100 characters", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/register")
        .send({
          name: "A".repeat(101),
          email: "longname@pantrypal.test",
          password: "ValidPassword123",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d) => d.field === "name")).toBe(true);
    });
  });

  describe("2. Login (POST /api/v1/auth/login)", () => {
    it("successfully logs in with valid credentials and returns accessToken", async () => {
      const rawPassword = "CorrectPassword123!";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-uuid-201",
        name: "Peach",
        email: "peach@pantrypal.test",
        password: hashedPassword,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: "peach@pantrypal.test",
          password: rawPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe("user-uuid-201");
      expect(res.body.data.user.email).toBe("peach@pantrypal.test");
      expect(res.body.data.accessToken).toBeDefined();

      // Verify JWT token is decodeable and signed with current JWT_SECRET
      const decoded = jwt.verify(res.body.data.accessToken, process.env.JWT_SECRET);
      expect(decoded.sub).toBe("user-uuid-201");

      // Password hash must never be returned in response
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("fails with 401 INVALID_CREDENTIALS when password does not match", async () => {
      const hashedPassword = await bcrypt.hash("RightPassword", 10);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-uuid-202",
        name: "Toad",
        email: "toad@pantrypal.test",
        password: hashedPassword,
        isActive: true,
      });

      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: "toad@pantrypal.test",
          password: "WrongPassword999!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("fails with 401 INVALID_CREDENTIALS when user does not exist", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@pantrypal.test",
          password: "AnyPassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("fails with 401 INVALID_CREDENTIALS when user account isActive is false", async () => {
      const hashedPassword = await bcrypt.hash("ValidPassword123", 10);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "inactive-user-uuid",
        name: "Deactivated User",
        email: "deactivated@pantrypal.test",
        password: hashedPassword,
        isActive: false,
      });

      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: "deactivated@pantrypal.test",
          password: "ValidPassword123",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("fails with 400 VALIDATION_ERROR when email or password is empty", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: "",
          password: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("fails with 400 VALIDATION_ERROR on malformed email address", async () => {
      const res = await supertest(app)
        .post("/api/v1/auth/login")
        .send({
          email: "invalid-email-address",
          password: "Password12345",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("3. Current User Profile (GET /api/v1/auth/me)", () => {
    it("returns profile for authenticated user with valid JWT Bearer token", async () => {
      const userId = "user-uuid-301";
      const validToken = generateAccessToken(userId);

      const mockUserProfile = {
        id: userId,
        name: "Bowser",
        email: "bowser@pantrypal.test",
        isActive: true,
        createdAt: new Date(),
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUserProfile);

      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(userId);
      expect(res.body.data.user.name).toBe("Bowser");
      expect(res.body.data.user.email).toBe("bowser@pantrypal.test");
      expect(res.body.data.user.isActive).toBe(true);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("fails with 401 AUTHENTICATION_REQUIRED when Authorization header is absent", async () => {
      const res = await supertest(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("fails with 401 INVALID_AUTH_HEADER when Authorization header does not use Bearer scheme", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Basic some-base64-credentials");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_AUTH_HEADER");
    });

    it("fails with 401 INVALID_TOKEN on malformed token string", async () => {
      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer not.a.valid.jwt.format");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("fails with 401 INVALID_TOKEN on expired token", async () => {
      const expiredToken = jwt.sign(
        { sub: "user-uuid-302" },
        process.env.JWT_SECRET,
        { expiresIn: "-1s" }
      );

      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("fails with 401 INVALID_TOKEN when signed with a different secret key", async () => {
      const foreignToken = jwt.sign(
        { sub: "user-uuid-303" },
        "completely-different-secret-key",
        { expiresIn: "1h" }
      );

      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${foreignToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("fails with 401 USER_NOT_AVAILABLE when user is deleted after token issuance", async () => {
      const validToken = generateAccessToken("deleted-user-uuid");

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("USER_NOT_AVAILABLE");
      expect(res.body.error.message).toBe("User account is not available");
    });

    it("fails with 401 USER_NOT_AVAILABLE when user account isActive is false", async () => {
      const validToken = generateAccessToken("disabled-user-uuid");

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "disabled-user-uuid",
        name: "Disabled User",
        email: "disabled@pantrypal.test",
        isActive: false,
      });

      const res = await supertest(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("USER_NOT_AVAILABLE");
    });
  });

  describe("4. JWT & Password Security Utilities", () => {
    it("generateAccessToken creates verifiable JWT with sub claim matching userId", () => {
      const userId = "test-user-jwt-100";
      const token = generateAccessToken(userId);

      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.exp).toBeDefined();
    });

    it("verifyAccessToken throws on tampered token", () => {
      const userId = "test-user-jwt-200";
      const token = generateAccessToken(userId);
      const tamperedToken = token.slice(0, -5) + "abcde";

      expect(() => verifyAccessToken(tamperedToken)).toThrow();
    });
  });
});

