const requiredEnv = ["PORT", "CORS_ORIGIN", "NODE_ENV"];

function getConfig() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      `[config] Missing env vars: ${missing.join(", ")}. Falling back to defaults where possible.`
    );
  }

  return {
    port: Number(process.env.PORT) || 3001,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    nodeEnv: process.env.NODE_ENV || "development",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
    bodyLimit: process.env.BODY_LIMIT || "100kb",
    logLevel: process.env.LOG_LEVEL || "dev",
  };
}

module.exports = getConfig();
