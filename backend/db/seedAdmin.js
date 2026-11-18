// One-shot ops script: creates the single admin account from env vars.
// Usage: node db/seedAdmin.js
import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set.");
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
  );
  if (result.rows.length) {
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  } else {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
  }
  await pool.end();
}

seedAdmin().catch((err) => {
  console.error("Seeding admin failed:", err);
  process.exit(1);
});
