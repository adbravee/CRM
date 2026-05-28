require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const config = require("./config");
const ticketsRouter = require("./routes/tickets");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const port = config.port;

app.disable("x-powered-by");
app.use(helmet());
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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", ticketsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${port}`);
});
