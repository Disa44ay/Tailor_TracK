import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

// Redirect DATABASE_URL to the test database BEFORE anything else in a test
// file (e.g. ../app.js, which builds backend/db/pool.js's pool from
// DATABASE_URL at import time) gets evaluated. This only works if this
// module is imported before app.js in every test file — ES module imports
// run top to bottom, so put this import first.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

export const testPool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });

export async function resetTables() {
  await testPool.query(
    "TRUNCATE notifications, payments, order_status_history, orders, measurements, users RESTART IDENTITY CASCADE"
  );
}

let userCounter = 0;

// Inserts a user directly (no signup flow, no real password) for tests that
// need a user to exist but aren't testing auth itself.
export async function insertTestUser({ role = "customer", name = "Test User", email } = {}) {
  userCounter += 1;
  const result = await testPool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, 'test-hash', $3)
     RETURNING id, name, email, role`,
    [name, email ?? `test-user-${userCounter}@example.com`, role]
  );
  return result.rows[0];
}
