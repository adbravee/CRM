const { Pool } = require("pg");

function createPool() {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.error(
      "\n[FATAL] DATABASE_URL is not set.\n" +
        "  Local: copy backend/.env.example → backend/.env\n" +
        "  Railway: Project → your service → Variables → add DATABASE_URL (Supabase URI)\n"
    );
    process.exit(1);
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

  return pool;
}

const pool = createPool();

module.exports = pool;
