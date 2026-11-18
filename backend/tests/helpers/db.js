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
