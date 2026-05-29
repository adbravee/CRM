function getConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  return {
    port: Number(process.env.PORT) || 3001,
    nodeEnv,
    isProduction,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    serveFrontend: process.env.SERVE_FRONTEND === "true",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
    bodyLimit: process.env.BODY_LIMIT || "100kb",
    logLevel: process.env.LOG_LEVEL || (isProduction ? "combined" : "dev"),
  };
}

module.exports = getConfig();
