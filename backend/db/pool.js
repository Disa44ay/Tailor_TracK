import pg from "pg";

const { Pool } = pg;

// Single shared connection pool, built from DATABASE_URL.
// Every query in the app should go through this pool.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
