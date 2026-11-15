/**
 * Test Database Safety Guard
 *
 * Enforces strict fail-closed authorization checks for test databases.
 * Guarantees that tests NEVER execute writes against production, staging,
 * or unrecognized shared databases.
 */

export const isAuthorizedPostgresTestUrl = (url = "") => {
  if (!url || typeof url !== "string") return false;

  // Never allow production / external cloud domains
  const blacklistedDomains = [
    "supabase.co",
    "neon.tech",
    "railway.app",
    "aws.com",
    "rds.amazonaws.com",
    "render.com",
    "heroku.com",
    "cockroachlabs.cloud",
  ];

  const hasBlacklistedDomain = blacklistedDomains.some((domain) =>
    url.toLowerCase().includes(domain)
  );
  if (hasBlacklistedDomain) return false;

  // Must match explicit test database naming conventions
  try {
    const parsed = new URL(url);
    const dbName = parsed.pathname.replace(/^\//, "");
    
    // Explicit whitelist: database name must end with _test or be exactly pantrypal_test or contain test
    const isTestDatabaseName =
      dbName.endsWith("_test") ||
      dbName === "pantrypal_test" ||
      dbName.includes("test");

    return isTestDatabaseName;
  } catch {
    // If not a standard URL, check regex
    return /([/_]test(\?|$)|pantrypal_test)/i.test(url);
  }
};

export const isAuthorizedMongoTestUri = (uri = "") => {
  if (!uri || typeof uri !== "string") return false;

  // Must explicitly target a test database name (e.g. /pantrypal_test)
  try {
    const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const slashIndex = withoutProtocol.indexOf("/");
    if (slashIndex === -1) return false;

    const pathPart = withoutProtocol.substring(slashIndex + 1);
    const questionIndex = pathPart.indexOf("?");
    const dbName = questionIndex === -1 ? pathPart : pathPart.substring(0, questionIndex);

    const isTestDb = dbName.endsWith("_test") || dbName === "pantrypal_test" || dbName.includes("test");
    return isTestDb;
  } catch {
    return /pantrypal_test/i.test(uri);
  }
};

export const assertAuthorizedTestDatabase = async (prisma, mongoose) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `CRITICAL TEST DATABASE SAFETY ERROR: NODE_ENV must be 'test' to run tests (received: '${process.env.NODE_ENV}'). Refusing all database operations.`
    );
  }

  const postgresUrl =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";

  if (!isAuthorizedPostgresTestUrl(postgresUrl)) {
    throw new Error(
      `CRITICAL TEST DATABASE SAFETY ERROR: Refusing to run tests against unauthorized PostgreSQL database URL: '${postgresUrl}'. ` +
      `Test database must explicitly point to an isolated test database (e.g. 'pantrypal_test').`
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

  // Verify MongoDB if connected
  if (mongoose && mongoose.connection.readyState === 1) {
    const currentDbName = mongoose.connection.db?.databaseName;
    if (!currentDbName || !currentDbName.includes("test")) {
      throw new Error(
        `CRITICAL MONGODB SAFETY ERROR: Active MongoDB connection is pointing to non-test database '${currentDbName}'. Refusing all test operations.`
      );
    }
  }

  return true;
};
