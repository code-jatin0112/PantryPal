import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import {
  generateAIResponse,
  generateStructuredAIResponse,
} from "../../src/services/aiService.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const createTestAuthToken = (userId = "11111111-1111-4111-8111-111111111111") => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

describe("AI Service Configuration & Fault Tolerance Integration Tests", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const token = createTestAuthToken(userId);

  const originalApiKey = process.env.LLM_API_KEY;
  const originalModel = process.env.LLM_MODEL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.LLM_API_KEY = originalApiKey;
    process.env.LLM_MODEL = originalModel;
  });

  describe("1. Application Startup & Non-AI Endpoint Availability", () => {
    it("health check endpoint remains fully functional when AI config is missing", async () => {
      delete process.env.LLM_API_KEY;
      delete process.env.LLM_MODEL;

      const res = await supertest(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("healthy");
    });
  });

  describe("2. Lazy Configuration & Clear 503 HTTP Errors", () => {
    it("returns 503 AI_CONFIG_ERROR when LLM_API_KEY is missing", async () => {
      delete process.env.LLM_API_KEY;
      process.env.LLM_MODEL = "gemini-1.5-flash";

      // Mock user preferences and non-empty pantry to satisfy controller prerequisites
      vi.spyOn(prisma.userPreference, "findUnique").mockResolvedValue({
        userId,
        dietaryPreferences: [],
        allergies: [],
        dislikedIngredients: [],
      });
      vi.spyOn(prisma.pantry, "findFirst").mockResolvedValue({
        id: "22222222-2222-4222-8222-222222222222",
        userId,
        items: [
          {
            id: "item-1",
            name: "Tomato",
            quantity: 3,
            unit: "pieces",
            category: "Vegetables",
          },
        ],
      });

      const res = await supertest(app)
        .post("/api/v1/ai/recipes/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pantryId: "22222222-2222-4222-8222-222222222222",
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AI_CONFIG_ERROR");
      expect(res.body.error.message).toContain("LLM_API_KEY");
    });

    it("returns 503 AI_CONFIG_ERROR when LLM_MODEL is missing", async () => {
      process.env.LLM_API_KEY = "dummy-api-key";
      delete process.env.LLM_MODEL;

      vi.spyOn(prisma.pantry, "findMany").mockResolvedValue([]);

      const res = await supertest(app)
        .post("/api/v1/ai/chat")
        .set("Authorization", `Bearer ${token}`)
        .send({
          message: "What can I cook tonight?",
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AI_CONFIG_ERROR");
      expect(res.body.error.message).toContain("LLM_MODEL");
    });

    it("throws 503 AppError directly from generateAIResponse if keys are missing", async () => {
      delete process.env.LLM_API_KEY;
      delete process.env.LLM_MODEL;

      await expect(
        generateAIResponse({
          systemInstruction: "You are a chef",
          prompt: "Suggest a soup",
        })
      ).rejects.toMatchObject({
        statusCode: 503,
        code: "AI_CONFIG_ERROR",
      });
    });

    it("throws 503 AppError directly from generateStructuredAIResponse if keys are missing", async () => {
      delete process.env.LLM_API_KEY;
      delete process.env.LLM_MODEL;

      await expect(
        generateStructuredAIResponse({
          systemInstruction: "You are a chef",
          prompt: "Suggest a soup",
          responseSchema: { type: "OBJECT" },
        })
      ).rejects.toMatchObject({
        statusCode: 503,
        code: "AI_CONFIG_ERROR",
      });
    });
  });
});
