import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import AppError from "../utils/AppError.js";

const getAIClientAndConfig = () => {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const timeout = Number(process.env.LLM_TIMEOUT || 30000);

  if (!apiKey || !model) {
    const missing = [];
    if (!apiKey) missing.push("LLM_API_KEY");
    if (!model) missing.push("LLM_MODEL");
    throw new AppError(
      `AI service is not configured: missing ${missing.join(", ")}`,
      503,
      "AI_CONFIG_ERROR"
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  return { ai, model, timeout };
};

const executeAIRequest = async ({
  systemInstruction,
  prompt,
  responseMimeType = "text/plain",
  responseSchema,
}) => {
  const { ai, model, timeout } = getAIClientAndConfig();

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
        ...(responseSchema && {
          responseSchema,
        }),
      },
      signal: controller.signal,
    });

    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError(
        "AI service request timed out",
        504,
        "AI_SERVICE_TIMEOUT"
      );
    }

    if (error instanceof AppError) {
      throw error;
    }

    const isQuotaExceeded =
      error.status === 429 ||
      error.statusCode === 429 ||
      error.code === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("RESOURCE_EXHAUSTED") ||
      error.message?.toLowerCase().includes("quota");

    if (isQuotaExceeded) {
      throw new AppError(
        "AI provider quota exceeded. Please try again in a few moments.",
        429,
        "AI_QUOTA_EXCEEDED"
      );
    }

    console.error("AI service error:", error);

    throw new AppError(
      "AI service is currently unavailable",
      503,
      "AI_SERVICE_UNAVAILABLE"
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const generateAIResponse = async ({
  systemInstruction,
  prompt,
}) => {
  const response = await executeAIRequest({
    systemInstruction,
    prompt,
  });

  return response.text;
};

export const generateStructuredAIResponse = async ({
  systemInstruction,
  prompt,
  responseSchema,
}) => {
  if (!responseSchema) {
    throw new AppError(
      "AI response schema is required",
      500,
      "AI_RESPONSE_SCHEMA_REQUIRED"
    );
  }

  const response = await executeAIRequest({
    systemInstruction,
    prompt,
    responseMimeType: "application/json",
    responseSchema,
  });

  const text = response.text;

  if (!text) {
    throw new AppError(
      "AI returned an empty response",
      502,
      "AI_EMPTY_RESPONSE"
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("AI JSON parsing error:", error);

    throw new AppError(
      "AI returned an invalid structured response",
      502,
      "AI_INVALID_RESPONSE"
    );
  }
};