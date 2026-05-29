require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const pool = require("./db");
const config = require("./config");
const ticketsRouter = require("./routes/tickets");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const port = config.port;
const frontendDist = path.join(__dirname, "../frontend/dist");

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: config.isProduction && config.serveFrontend ? false : undefined,
  })
);
app.use(compression());
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(morgan(config.logLevel));

app.use(
  cors({
    origin: config.corsOrigin,
  })
);

app.use(express.json({ limit: config.bodyLimit }));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch {
    res.status(503).json({ ok: false, database: "disconnected" });
  }
});

app.use("/api", ticketsRouter);

if (config.isProduction && config.serveFrontend) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});
