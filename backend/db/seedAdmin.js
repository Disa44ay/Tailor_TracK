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
  // Upsert on the single admin slot (one_admin_account index), so rerunning with
  // a changed ADMIN_EMAIL updates the admin instead of violating the index.
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (role) WHERE role = 'admin'
     DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash`,
    [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
  );
  console.log(`Admin set: ${ADMIN_EMAIL}`);
  await pool.end();
}

seedAdmin().catch((err) => {
  console.error("Seeding admin failed:", err);
  process.exit(1);
});
