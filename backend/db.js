const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Copy backend/.env.example to backend/.env and add your Supabase connection string."
  );
}

const needsSsl =
  process.env.DATABASE_SSL === "true" ||
  /supabase\.com|neon\.tech|render\.com|railway\.app/i.test(
    process.env.DATABASE_URL
  );

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("[db] Unexpected pool error", err);
});

module.exports = pool;
