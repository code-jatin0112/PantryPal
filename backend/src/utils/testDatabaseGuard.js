/**
 * Test Database Safety Guard
 *
 * Enforces strict fail-closed authorization checks for test databases.
 * Guarantees that tests NEVER execute writes against production, staging,
 * or unrecognized shared databases.
 */

export const APPROVED_TEST_HOSTS = new Set(["localhost", "127.0.0.1"]);
export const APPROVED_TEST_DB_NAME = "pantrypal_test";
export const APPROVED_POSTGRES_PROTOCOLS = new Set(["postgresql:", "postgres:"]);
export const APPROVED_MONGO_PROTOCOLS = new Set(["mongodb:", "mongodb+srv:"]);

/**
 * Sanitizes connection strings by redacting username and password.
 * Never includes credentials in thrown errors or logs.
 */
export const sanitizeDatabaseUrl = (url = "") => {
  if (!url || typeof url !== "string") return "";
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "******";
    if (parsed.username) parsed.username = "******";
    return parsed.toString();
  } catch {
    return url.replace(/:\/\/([^:@]+):([^@]+)@/, "://******:******@");
  }
};

/**
 * Validates that a PostgreSQL URL strictly points to the approved test database
 * on approved test infrastructure.
 */
export const isAuthorizedPostgresTestUrl = (url = "") => {
  if (!url || typeof url !== "string") return false;

  // Explicit blacklist check for any known cloud/production providers
  const blacklistedDomains = [
    "supabase.co",
    "neon.tech",
    "railway.app",
    "aws.com",
    "rds.amazonaws.com",
    "render.com",
    "heroku.com",
    "cockroachlabs.cloud",
    "azure.com",
    "google.com",
  ];
  const lowerUrl = url.toLowerCase();
  if (blacklistedDomains.some((domain) => lowerUrl.includes(domain))) {
    return false;
  }

  try {
    const parsed = new URL(url);

    // Validate protocol
    if (!APPROVED_POSTGRES_PROTOCOLS.has(parsed.protocol)) {
      return false;
    }

    // Validate hostname strictly against approved test infrastructure
    const hostname = parsed.hostname.toLowerCase();
    if (!APPROVED_TEST_HOSTS.has(hostname)) {
      return false;
    }

    // Validate exact database name (must be exactly 'pantrypal_test')
    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0];
    if (dbName !== APPROVED_TEST_DB_NAME) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Validates that a MongoDB URI strictly points to the approved test database
 * on approved test infrastructure.
 */
export const isAuthorizedMongoTestUri = (uri = "") => {
  if (!uri || typeof uri !== "string") return false;

  const blacklistedDomains = [
    "mongodb.net",
    "atlas.mongodb.com",
    "aws.com",
    "azure.com",
  ];
  const lowerUri = uri.toLowerCase();
  if (blacklistedDomains.some((domain) => lowerUri.includes(domain))) {
    return false;
  }

  try {
    let parsed;
    try {
      parsed = new URL(uri);
    } catch {
      const cleanUri = uri.replace(/^mongodb(\+srv)?:\/\//, "http://");
      parsed = new URL(cleanUri);
      parsed.protocol = uri.startsWith("mongodb+srv") ? "mongodb+srv:" : "mongodb:";
    }

    if (!APPROVED_MONGO_PROTOCOLS.has(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!APPROVED_TEST_HOSTS.has(hostname)) {
      return false;
    }

    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0];
    if (dbName !== APPROVED_TEST_DB_NAME) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Strict fail-closed guard before ANY database operation.
 */
export const assertAuthorizedTestDatabase = async (prisma, mongoose) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `CRITICAL TEST DATABASE SAFETY ERROR: NODE_ENV must be 'test' to run tests (received: '${process.env.NODE_ENV}'). Refusing all database operations.`
    );
  }

  // Require explicitly configured TEST_DATABASE_URL and MONGO_TEST_URI - NO implicit fallbacks!
  const testPostgresUrl = process.env.TEST_DATABASE_URL;
  if (!testPostgresUrl) {
    throw new Error(
      "CRITICAL TEST DATABASE SAFETY ERROR: TEST_DATABASE_URL must be explicitly configured in the test environment. Implicit fallbacks are disabled."
    );
  }

  const testMongoUri = process.env.MONGO_TEST_URI;
  if (!testMongoUri) {
    throw new Error(
      "CRITICAL TEST DATABASE SAFETY ERROR: MONGO_TEST_URI must be explicitly configured in the test environment. Implicit fallbacks are disabled."
    );
  }

  // Validate PostgreSQL URL
  if (!isAuthorizedPostgresTestUrl(testPostgresUrl)) {
    const sanitized = sanitizeDatabaseUrl(testPostgresUrl);
    throw new Error(
      `CRITICAL TEST DATABASE SAFETY ERROR: Refusing to run tests against unauthorized PostgreSQL database URL: '${sanitized}'. ` +
      `Test database must strictly point to '${APPROVED_TEST_DB_NAME}' on approved test hosts (${Array.from(APPROVED_TEST_HOSTS).join(', ')}).`
    );
  }

  // Validate MongoDB URI
  if (!isAuthorizedMongoTestUri(testMongoUri)) {
    const sanitized = sanitizeDatabaseUrl(testMongoUri);
    throw new Error(
      `CRITICAL TEST DATABASE SAFETY ERROR: Refusing to run tests against unauthorized MongoDB URI: '${sanitized}'. ` +
      `Test MongoDB database must strictly point to '${APPROVED_TEST_DB_NAME}' on approved test hosts (${Array.from(APPROVED_TEST_HOSTS).join(', ')}).`
    );
  }

  // Verify actual connectivity to PostgreSQL
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1;`;
    } catch (dbErr) {
      throw new Error(
        `CRITICAL TEST DATABASE CONNECTION ERROR: Required test database connection failed: ${dbErr.message}. Tests cannot proceed.`
      );
    }
  }

  // Verify actual MongoDB connection database name if connected
  if (mongoose && mongoose.connection.readyState === 1) {
    const currentDbName = mongoose.connection.db?.databaseName;
    if (currentDbName !== APPROVED_TEST_DB_NAME) {
      const sanitizedDb = currentDbName ? String(currentDbName) : "unknown";
      throw new Error(
        `CRITICAL MONGODB SAFETY ERROR: Active MongoDB connection is pointing to database '${sanitizedDb}', expected '${APPROVED_TEST_DB_NAME}'. Refusing all test operations.`
      );
    }
  }

  return true;
};
