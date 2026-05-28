function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
}

function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error("[server-error]", err);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Unexpected error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
