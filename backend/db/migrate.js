// Reads schema.sql and runs it against process.env.DATABASE_URL.
// Usage: node db/migrate.js
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("Migration applied.");
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
