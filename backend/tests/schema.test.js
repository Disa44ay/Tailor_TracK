import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetTables } from "./helpers/db.js";

// Other test files leave an admin row behind; clear users so the one-admin insert starts from zero.
beforeEach(async () => {
  await resetTables();
});

test("migration creates the booking tables", async () => {
  const { rows } = await testPool.query(
    `select table_name from information_schema.tables where table_schema = 'public'`
  );
  const names = rows.map((r) => r.table_name).sort();
  assert.deepEqual(names, ["enquiries", "enquiry_items", "enquiry_messages", "users"]);
});

test("users has profile columns", async () => {
  const { rows } = await testPool.query(
    `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'users'`
  );
  const cols = rows.map((r) => r.column_name);
  for (const c of ["first_name", "last_name", "height_cm", "weight_kg", "age"]) {
    assert.ok(cols.includes(c), `missing column ${c}`);
  }
});

test("only one admin account can exist", async () => {
  await testPool.query(`delete from users where email like 'schema-test-%'`);
  try {
    await testPool.query(
      `insert into users (name, email, password_hash, role) values ('a', 'schema-test-admin1@x.test', 'h', 'admin')`
    );
    await assert.rejects(
      testPool.query(
        `insert into users (name, email, password_hash, role) values ('b', 'schema-test-admin2@x.test', 'h', 'admin')`
      )
    );
  } finally {
    await testPool.query(`delete from users where email like 'schema-test-%'`);
  }
});

test("message rows need a body and date rows need a date", async () => {
  const { rows } = await testPool.query(
    `insert into users (name, email, password_hash, role) values ('c', 'schema-test-msg@x.test', 'h', 'customer') returning id`
  );
  try {
    const enq = await testPool.query(
      `insert into enquiries (user_id) values ($1) returning id`,
      [rows[0].id]
    );
    await assert.rejects(
      testPool.query(
        `insert into enquiry_messages (enquiry_id, sender, kind) values ($1, 'customer', 'message')`,
        [enq.rows[0].id]
      )
    );
    await assert.rejects(
      testPool.query(
        `insert into enquiry_messages (enquiry_id, sender, kind) values ($1, 'admin', 'date_proposal')`,
        [enq.rows[0].id]
      )
    );
  } finally {
    await testPool.query(`delete from users where email like 'schema-test-%'`);
  }
});
