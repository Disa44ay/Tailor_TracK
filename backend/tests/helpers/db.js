import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const testPool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });

export async function resetTables() {
  await testPool.query(
    "TRUNCATE notifications, payments, order_status_history, orders, measurements, users RESTART IDENTITY CASCADE"
  );
}
