import express from "express";
import prisma from "../config/database.js";
import mongoose from "mongoose";
import { connectMongo } from "../config/mongo.js";
import { sanitizeDatabaseUrl } from "../utils/testDatabaseGuard.js";

const router = express.Router();

/**
 * Lightweight Liveness Probe
 * Validates that the Node.js/Express process is responsive to HTTP traffic.
 * Does NOT perform external network I/O or fail if external databases have transient latency.
 */
router.get(["/", "/liveness"], (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Deep Readiness Probe
 * Validates that all critical datastores (PostgreSQL relational database and MongoDB NoSQL database)
 * are connected and responsive with bounded timeouts.
 *
 * Guarantees:
 * - Returns HTTP 200 { status: "ready" } only when all required datastores respond within bounded timeout.
 * - Returns HTTP 503 { status: "unhealthy" } if any required datastore fails or times out.
 * - Never returns connection strings, credentials, or internal stack traces in response payloads.
 * - All server log messages are sanitized via sanitizeDatabaseUrl.
 */
router.get(["/readiness", "/ready"], async (req, res) => {
  const TIMEOUT_MS = 3000;

  // 1. PostgreSQL Bounded Connectivity Check
  let postgresConnected = false;
  let pgTimer;
  try {
    const pgCheckPromise = prisma.$queryRawUnsafe("SELECT 1");
    const pgTimeoutPromise = new Promise((_, reject) => {
      pgTimer = setTimeout(() => reject(new Error("PostgreSQL health check timed out")), TIMEOUT_MS);
    });
    await Promise.race([pgCheckPromise, pgTimeoutPromise]);
    postgresConnected = true;
  } catch (err) {
    console.warn("[Health:Readiness] PostgreSQL check failed:", sanitizeDatabaseUrl(err.message || String(err)));
  } finally {
    clearTimeout(pgTimer);
  }

  // 2. MongoDB Bounded Connectivity Check
  let mongoConnected = false;
  let mongoTimer;
  try {
    if (mongoose.connection.readyState !== 1) {
      const connectPromise = connectMongo();
      const mongoTimeoutPromise = new Promise((_, reject) => {
        mongoTimer = setTimeout(() => reject(new Error("MongoDB connection timed out")), TIMEOUT_MS);
      });
      await Promise.race([connectPromise, mongoTimeoutPromise]);
    }

    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const pingPromise = mongoose.connection.db.command({ ping: 1 });
      const pingTimeoutPromise = new Promise((_, reject) => {
        mongoTimer = setTimeout(() => reject(new Error("MongoDB ping timed out")), TIMEOUT_MS);
      });
      await Promise.race([pingPromise, pingTimeoutPromise]);
      mongoConnected = true;
    }
  } catch (err) {
    console.warn("[Health:Readiness] MongoDB check failed:", sanitizeDatabaseUrl(err.message || String(err)));
  } finally {
    clearTimeout(mongoTimer);
  }

  const isReady = postgresConnected && mongoConnected;

  const statusCode = isReady ? 200 : 503;
  return res.status(statusCode).json({
    success: isReady,
    data: {
      status: isReady ? "ready" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        postgres: postgresConnected ? "connected" : "disconnected",
        mongodb: mongoConnected ? "connected" : "disconnected",
      },
    },
  });
});

export default router;
