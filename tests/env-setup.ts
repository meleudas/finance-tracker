/**
 * Runs before test files (see jest.config.cjs `setupFiles`).
 * Ensures `src/config/env` can parse `process.env` when tests import the app.
 */
process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://test:test@localhost:5432/finance_tracker_test?schema=public";
process.env.JWT_ACCESS_SECRET = "test-access-secret-32-characters!!";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-32-characters!!";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.LOG_LEVEL = "silent";
