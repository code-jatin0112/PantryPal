import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { isAuthorizedPostgresTestUrl, sanitizeDatabaseUrl } from "../utils/testDatabaseGuard.js";

let connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "test") {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      "CRITICAL TEST DATABASE SAFETY ERROR: TEST_DATABASE_URL must be explicitly configured in test environment."
    );
  }
  if (!isAuthorizedPostgresTestUrl(testUrl)) {
    const sanitized = sanitizeDatabaseUrl(testUrl);
    throw new Error(
      `CRITICAL TEST DATABASE SAFETY ERROR: TEST_DATABASE_URL '${sanitized}' failed test safety authorization.`
    );
  }
  connectionString = testUrl;
  process.env.DATABASE_URL = testUrl;
}

export const pgPoolConfig = {
  connectionString,
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 3000),
  query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 5000),
  statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 5000),
  max: Number(process.env.PG_MAX_POOL || 10),
};

const adapter = new PrismaPg(pgPoolConfig);

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
