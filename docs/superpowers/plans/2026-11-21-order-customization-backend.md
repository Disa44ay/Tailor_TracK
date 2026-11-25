# Order Customization Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** give the backend the data the frontend's live-customization order flow needs — body profile fields, a fabric catalog, and order records that capture both.

**Architecture:** five self-contained tasks, each following an existing codebase pattern exactly (ALTER-TABLE tail block, `FIELDS`/`COLUMNS` + COALESCE partial update, route/controller module pairing, `seedAdmin.js`-style seed script, snapshot-at-submit-time). No new pattern is introduced.

**Tech Stack:** Express, raw SQL via `pg`, `node:test` + `supertest`, Postgres (local Docker in dev/test).

**Spec:** `docs/superpowers/specs/2026-11-21-order-customization-backend-design.md`

## Global Constraints

- Raw SQL via `pg`, no ORM.
- Every numeric column read back through the API is cast `::double precision` (pg otherwise returns `numeric` as a string) — match the existing pattern in `measurements.controller.js` / `orders.controller.js`.
- `PUT`/`POST` request bodies use camelCase field names; `GET` responses return the raw snake_case column names (existing asymmetric convention — do not camelCase responses).
- No image/sketch generation or storage of any kind — out of scope entirely.
- No change to any existing endpoint's behavior for callers that omit the new fields.

## Review Focus

- `fabricId` sent as a non-numeric value (string, object) on `POST /orders` → without type-checking first, the DB query throws a type-mismatch error that surfaces as an uncaught 500 instead of a clean 400. Task 5 validates the type before querying and tests it.
- Placing an order with no measurements on file yet (a brand-new customer's first order) → `body_profile_snapshot` must come back `null`, not throw. Task 5's main test asserts this directly (same `?? null` pattern `getMeasurementsSnapshot` already uses, reused unchanged).
- `GET /fabrics` called with no/invalid auth → must 401 like every other authenticated route, not a new code path. Task 3 adds the no-auth test.
- Two fabrics entered under the same name (a catalog data-entry mistake) → must be rejected at the DB level rather than silently creating two IDs for what customers see as one fabric. Task 1 puts `UNIQUE` on `fabrics.name`; Task 4's seed script's `ON CONFLICT (name) DO NOTHING` depends on this and is what makes re-running the seed script safe.
- A fabric deactivated after an order already references it → the order's `fabric_id` must keep pointing at it; `is_active` filtering must never apply when reading an existing order. No task adds code here (orders never join `fabrics`), but it's stated so nobody "fixes" this later by adding an active-only join to order reads.

**Note on two small deviations from the design doc,** found while writing this plan:
1. The design doc listed updating `ALL_MEASUREMENT_FIELDS`/`measurementRelevance.js` for height/weight/age. That map governs which of the 14 *garment* measurements a given garment type's form shows — height/weight/age aren't garment-specific, they're profile-level, so they don't belong in it. Task 2 only touches `measurements.controller.js`.
2. The design doc's `age` column had `CHECK (age > 0)`. No other measurement column has a range check (all 14 existing fields accept any number), and adding controller-level validation just for this one field to turn a constraint violation into a clean 400 is more code than the gain justifies. Dropped the CHECK for consistency with every sibling field — `age integer`, validated the same generic "must be a number" way as the rest.

---

### Task 1: Schema migration

**Files:**
- Modify: `backend/db/schema.sql`
- Modify: `backend/tests/schema.test.js`

**Interfaces:**
- Produces: `measurements.height_cm`, `measurements.weight_kg`, `measurements.age` (numeric/numeric/integer, nullable); `fabrics` table (`id`, `name` UNIQUE, `color_hex`, `print_pattern`, `texture`, `swatch_image_url`, `price_modifier`, `is_active`, `created_at`); `orders.fabric_id` (FK → `fabrics.id`, nullable), `orders.body_profile_snapshot` (jsonb, nullable). Every later task reads these exact names.

- [ ] **Step 1: Update the failing test in `backend/tests/schema.test.js`**

Change the test name and assertion to expect `fabrics` as a seventh table:

```js
test("migration creates all seven tables", async () => {
  const { rows } = await testPool.query(
    `select table_name from information_schema.tables where table_schema = 'public'`
  );
  const names = rows.map((r) => r.table_name).sort();
  assert.deepEqual(names, [
    "fabrics",
    "measurements",
    "notifications",
    "order_status_history",
    "orders",
    "payments",
    "users",
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- --test-name-pattern="migration creates all seven tables"`
Expected: FAIL — actual list has six entries, missing `fabrics`.

- [ ] **Step 3: Implement the schema changes in `backend/db/schema.sql`**

Add a `CREATE TABLE IF NOT EXISTS fabrics (...)` block after the existing `notifications` table definition (no FK dependencies, so position among the `CREATE TABLE`s doesn't matter beyond preceding the `orders.fabric_id` ALTER below):

```sql
CREATE TABLE IF NOT EXISTS fabrics (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color_hex text NOT NULL CHECK (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  print_pattern text NOT NULL DEFAULT 'solid' CHECK (print_pattern IN ('solid', 'striped', 'checked')),
  texture text NOT NULL CHECK (texture IN ('cotton', 'linen', 'silk', 'wool', 'denim')),
  swatch_image_url text,
  price_modifier numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Add to the end of the existing `ALTER TABLE` tail block:

```sql
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_id integer REFERENCES fabrics(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS body_profile_snapshot jsonb;
```

- [ ] **Step 4: Apply the migration to both local databases**

Run (from `backend/`, with `TEST_DATABASE_URL`'s value substituted for `DATABASE_URL` for the second one):
`npm run db:migrate --workspace=backend`
`DATABASE_URL=<value of TEST_DATABASE_URL in .env> node db/migrate.js` (run from `backend/`)
Expected: `Migration applied.` from both.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=backend -- --test-name-pattern="migration creates all seven tables"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/db/schema.sql backend/tests/schema.test.js
git commit -m "feat(db): add fabrics table and body-profile/order columns"
```

---

### Task 2: Height/weight/age on the measurements endpoint

**Files:**
- Modify: `backend/controllers/measurements.controller.js`
- Test: `backend/tests/measurements.test.js`

**Interfaces:**
- Consumes: Task 1's `measurements.height_cm`/`weight_kg`/`age` columns.
- Produces: `PUT /me/measurements` and `GET /me/measurements` accept/return `heightCm`→`height_cm`, `weightKg`→`weight_kg`, `age`→`age` (request camelCase, response snake_case, same as the other 14 fields).

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/measurements.test.js`:

```js
test("PUT accepts and GET reflects heightCm, weightKg, and age", async () => {
  const customer = await insertTestUser({ role: "customer" });
  const auth = `Bearer ${signToken(customer)}`;

  const putRes = await request(app)
    .put("/me/measurements")
    .set("Authorization", auth)
    .send({ heightCm: 175, weightKg: 70, age: 28 });
  assert.equal(putRes.status, 200);
  assert.equal(putRes.body.height_cm, 175);
  assert.equal(putRes.body.weight_kg, 70);
  assert.equal(putRes.body.age, 28);

  const getRes = await request(app).get("/me/measurements").set("Authorization", auth);
  assert.equal(getRes.body.height_cm, 175);
  assert.equal(getRes.body.age, 28);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- --test-name-pattern="heightCm, weightKg, and age"`
Expected: FAIL — `putRes.body.height_cm` is `undefined` (field not in `FIELDS`/`COLUMNS`).

- [ ] **Step 3: Implement in `backend/controllers/measurements.controller.js`**

Add `"heightCm", "weightKg", "age"` to `FIELDS` and `"height_cm", "weight_kg", "age"` to `COLUMNS` (same index order in both arrays — the rest of the function is unchanged, since it already loops generically over both). Update `EMPTY_MEASUREMENTS`'s derivation too (it's already generated from `COLUMNS`, so no separate edit needed there — just confirm it still reads `Object.fromEntries(COLUMNS.map(...))`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- --test-name-pattern="heightCm, weightKg, and age"`
Expected: PASS

- [ ] **Step 5: Run the full backend suite**

Run: `npm test --workspace=backend`
Expected: all tests pass (no regression in the other measurements tests from the array changes).

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/measurements.controller.js backend/tests/measurements.test.js
git commit -m "feat(measurements): accept height, weight, and age"
```

---

### Task 3: `GET /fabrics`

**Files:**
- Create: `backend/controllers/fabrics.controller.js`
- Create: `backend/routes/fabrics.routes.js`
- Modify: `backend/app.js`
- Modify: `backend/tests/helpers/db.js`
- Test: Create `backend/tests/fabrics.test.js`

**Interfaces:**
- Consumes: Task 1's `fabrics` table.
- Produces: `getFabrics(req, res)` in `fabrics.controller.js`; `GET /fabrics` (auth required, any role) returning `[{ id, name, color_hex, print_pattern, texture, swatch_image_url, price_modifier }]` for `is_active = true` rows, ordered by `name`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/fabrics.test.js`:

```js
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser, testPool } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

async function insertFabric({
  name = "Navy Cotton",
  colorHex = "#1b2a4a",
  texture = "cotton",
  isActive = true,
} = {}) {
  await testPool.query(
    `INSERT INTO fabrics (name, color_hex, texture, is_active) VALUES ($1, $2, $3, $4)`,
    [name, colorHex, texture, isActive]
  );
}

test("GET /fabrics returns only active fabrics, ordered by name", async () => {
  const customer = await insertTestUser({ role: "customer" });
  await insertFabric({ name: "Navy Cotton" });
  await insertFabric({ name: "Discontinued Silk", texture: "silk", isActive: false });

  const res = await request(app)
    .get("/fabrics")
    .set("Authorization", `Bearer ${signToken(customer)}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].name, "Navy Cotton");
  assert.equal(res.body[0].color_hex, "#1b2a4a");
});

test("GET /fabrics without auth returns 401", async () => {
  const res = await request(app).get("/fabrics");
  assert.equal(res.status, 401);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend -- --test-name-pattern="GET /fabrics"`
Expected: FAIL — route doesn't exist (404s, not 200/401).

- [ ] **Step 3: Implement `getFabrics(req, res)` in `backend/controllers/fabrics.controller.js`**

```js
import { pool } from "../db/pool.js";

const FABRIC_COLUMNS = `
  id, name, color_hex, print_pattern, texture, swatch_image_url,
  price_modifier::double precision AS price_modifier
`;

export async function getFabrics(req, res) {
  const result = await pool.query(
    `SELECT ${FABRIC_COLUMNS} FROM fabrics WHERE is_active = true ORDER BY name`
  );
  res.json(result.rows);
}
```

- [ ] **Step 4: Create `backend/routes/fabrics.routes.js`**

```js
import { Router } from "express";
import { getFabrics } from "../controllers/fabrics.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/fabrics", requireAuth, asyncHandler(getFabrics));

export default router;
```

- [ ] **Step 5: Wire it into `backend/app.js`**

Add `import fabricsRoutes from "./routes/fabrics.routes.js";` beside the other route imports and `app.use(fabricsRoutes);` beside the other `app.use(...Routes)` calls (position: anywhere among them, e.g. after `measurementsRoutes`).

- [ ] **Step 6: Add `fabrics` to the test-reset list in `backend/tests/helpers/db.js`**

Change `resetTables()`'s TRUNCATE statement to:
```js
await testPool.query(
  "TRUNCATE notifications, payments, order_status_history, orders, fabrics, measurements, users RESTART IDENTITY CASCADE"
);
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test --workspace=backend -- --test-name-pattern="GET /fabrics"`
Expected: PASS

- [ ] **Step 8: Run the full backend suite**

Run: `npm test --workspace=backend`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add backend/controllers/fabrics.controller.js backend/routes/fabrics.routes.js backend/app.js backend/tests/helpers/db.js backend/tests/fabrics.test.js
git commit -m "feat(fabrics): add GET /fabrics catalog endpoint"
```

---

### Task 4: Fabric seed script

**Files:**
- Create: `backend/db/seedFabrics.js`
- Modify: `backend/package.json` (add a `db:seed:fabrics` script, mirroring `db:seed:admin`)

**Interfaces:**
- Consumes: Task 1's `fabrics` table (the `name` UNIQUE constraint is what makes this safe to re-run).

No automated test for this task — `seedAdmin.js`, the pattern it mirrors, has none either; it's a one-shot ops script, verified by running it.

- [ ] **Step 1: Create `backend/db/seedFabrics.js`**

Mirror `seedAdmin.js`'s structure (import `dotenv/config` and `pool`, run inserts, `pool.end()` in a `finally`/at the end, exit 1 on failure). Seed 5 fabrics covering each `texture` value once, varying `print_pattern`:

```js
const FABRICS = [
  { name: "Navy Cotton", colorHex: "#1b2a4a", printPattern: "solid", texture: "cotton" },
  { name: "Charcoal Wool", colorHex: "#3a3a3a", printPattern: "solid", texture: "wool" },
  { name: "Ivory Linen", colorHex: "#f2ead9", printPattern: "solid", texture: "linen" },
  { name: "Burgundy Silk", colorHex: "#5c1a2b", printPattern: "striped", texture: "silk" },
  { name: "Indigo Denim", colorHex: "#2c3e63", printPattern: "checked", texture: "denim" },
];
```

For each, `INSERT INTO fabrics (name, color_hex, print_pattern, texture) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING`.

- [ ] **Step 2: Add the npm script to `backend/package.json`**

Add `"db:seed:fabrics": "node db/seedFabrics.js"` beside the existing `"db:seed:admin"` entry.

- [ ] **Step 3: Run it and verify**

Run: `npm run db:seed:fabrics --workspace=backend`
Expected: console output confirms 5 fabrics inserted (or already-present, on a second run).

- [ ] **Step 4: Commit**

```bash
git add backend/db/seedFabrics.js backend/package.json
git commit -m "feat(fabrics): add fabric catalog seed script"
```

---

### Task 5: `POST /orders` accepts `fabricId` and snapshots the body profile

**Files:**
- Modify: `backend/controllers/orders.controller.js`
- Test: `backend/tests/orders.create.test.js`

**Interfaces:**
- Consumes: Task 1's `orders.fabric_id`/`orders.body_profile_snapshot` columns, Task 1's `fabrics` table, Task 2's `measurements.height_cm`/`weight_kg`/`age`.
- Produces: `POST /orders` accepts optional `fabricId` (integer, must reference an active fabric); response includes `fabric_id` and `body_profile_snapshot` (`{ height_cm, weight_kg, age }` or `null`) in `ORDER_COLUMNS`.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/orders.create.test.js`:

```js
test("POST /orders accepts a fabricId and snapshots the body profile", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const auth = `Bearer ${signToken(customer)}`;

  await request(app)
    .put("/me/measurements")
    .set("Authorization", auth)
    .send({ heightCm: 175, weightKg: 70, age: 28 });

  const fabric = await testPool.query(
    `INSERT INTO fabrics (name, color_hex, texture) VALUES ('Navy Cotton', '#1b2a4a', 'cotton') RETURNING id`
  );
  const fabricId = fabric.rows[0].id;

  const res = await request(app)
    .post("/orders")
    .set("Authorization", auth)
    .send({ garmentType: "shirt", fabricId });

  assert.equal(res.status, 201);
  assert.equal(res.body.fabric_id, fabricId);
  assert.equal(res.body.body_profile_snapshot.height_cm, 175);
  assert.equal(res.body.body_profile_snapshot.age, 28);
});

test("POST /orders with no measurements on file snapshots a null body profile", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "shirt" });
  assert.equal(res.status, 201);
  assert.equal(res.body.body_profile_snapshot, null);
});

test("POST /orders with an unrecognized or inactive fabricId returns 400", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "shirt", fabricId: 999999 });
  assert.equal(res.status, 400);
});

test("POST /orders with a non-numeric fabricId returns 400", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "shirt", fabricId: "navy" });
  assert.equal(res.status, 400);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend -- --test-name-pattern="fabricId"`
Expected: FAIL — `fabric_id`/`body_profile_snapshot` not in `ORDER_COLUMNS`, `fabricId` not read or validated yet.

- [ ] **Step 3: Implement in `backend/controllers/orders.controller.js`**

Add a body-profile snapshot helper beside `getMeasurementsSnapshot`:

```js
async function getBodyProfileSnapshot(customerId) {
  const result = await pool.query(
    `SELECT height_cm::double precision AS height_cm, weight_kg::double precision AS weight_kg, age
     FROM measurements WHERE customer_id = $1`,
    [customerId]
  );
  const row = result.rows[0];
  if (!row || (row.height_cm === null && row.weight_kg === null && row.age === null)) return null;
  return row;
}
```

In `createOrder`: destructure `fabricId` from `req.body` alongside the existing fields. Before the existing validation block, validate its type and existence:

```js
if (fabricId !== undefined && fabricId !== null && typeof fabricId !== "number") {
  return res.status(400).json({ message: "fabricId must be a number" });
}
```

After the existing `lapelError` check, resolve it against the DB (only when provided):

```js
let resolvedFabricId = null;
if (fabricId !== undefined && fabricId !== null) {
  const fabricResult = await pool.query("SELECT id FROM fabrics WHERE id = $1 AND is_active = true", [fabricId]);
  if (!fabricResult.rows.length) {
    return res.status(400).json({ message: "Unrecognized or inactive fabric" });
  }
  resolvedFabricId = fabricId;
}
```

Call `const bodyProfileSnapshot = await getBodyProfileSnapshot(req.user.id);` alongside the existing `getMeasurementsSnapshot` call. Add `fabric_id, body_profile_snapshot` to `ORDER_COLUMNS`, add both columns to the `INSERT` statement's column list/placeholders/values (`resolvedFabricId`, `bodyProfileSnapshot`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --workspace=backend -- --test-name-pattern="fabricId"`
Expected: PASS

- [ ] **Step 5: Run the full backend suite**

Run: `npm test --workspace=backend`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/orders.controller.js backend/tests/orders.create.test.js
git commit -m "feat(orders): accept fabricId and snapshot the body profile"
```
