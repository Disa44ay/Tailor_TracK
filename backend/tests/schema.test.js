import { test } from "node:test";
import assert from "node:assert/strict";
import { testPool } from "./helpers/db.js";

test("migration creates all six tables", async () => {
  const { rows } = await testPool.query(
    `select table_name from information_schema.tables where table_schema = 'public'`
  );
  const names = rows.map((r) => r.table_name).sort();
  assert.deepEqual(names, [
    "measurements",
    "notifications",
    "order_status_history",
    "orders",
    "payments",
    "users",
  ]);
});
