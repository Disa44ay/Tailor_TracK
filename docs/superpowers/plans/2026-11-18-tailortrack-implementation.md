# TailorTrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build TailorTrack — a single-shop, single-admin tailoring order tracker with customer self-service (measurements, requests, invoice confirm/pay, status tracking) and an admin workflow (review, quote, production stages, payments, reports), backed by one Postgres database.

**Architecture:** Express backend with raw SQL via `pg` (routes → controllers → `db/pool.js`, no ORM), React (Vite, plain JS) + Tailwind frontend calling the backend as a REST API, JWT auth over `Authorization` headers. Backend tasks are built and tested bottom-up (schema → auth → notifications service → each order-lifecycle slice → reports) since each layer's tests need the one below it; frontend tasks follow once their endpoints exist.

**Tech Stack:** Node.js, Express, `pg`, `jsonwebtoken`, `bcrypt`, `node:test` (built-in) + `supertest` for backend tests; React 19, Vite, Tailwind CSS v4, Vitest + `@testing-library/react` for frontend tests; PostgreSQL (Docker locally).

**Spec:** `docs/superpowers/specs/2026-11-18-tailortrack-design.md` (and its revision source, `docs/revised-idea.md`). Implementers should read both — this plan argues from them but does not repeat everything in them.

## Global Constraints

- Single shop, single admin account — no multi-tenant ID anywhere, no multiple staff accounts.
- No ORM. Every query is raw SQL through the shared `pg` pool in `backend/db/pool.js`.
- Auth is JWT in an `Authorization: Bearer <token>` header, not cookies.
- Payments use SSLCommerz's **sandbox** environment only (`is_live: false`); no live gateway.
- Notifications are in-app only (no email/SMS), one-way (no reply threads), fetched on demand (no websockets/polling infra).
- An order is never forked: reject→edit→resubmit and quote→decline both operate on the same row via `order_status_history`.
- `due_date`, `quoted_price`, `advance_required` are set only by the admin, only at the quote step; the customer never sets them.
- `garment_type` is one of: `shirt`, `pant`, `panjabi`, `suit_2pc`, `suit_3pc`, `kurta`, `blouse`, `other`.
- Measurement fields: `chest`, `waist`, `hip`, `shoulder_width`, `sleeve_length`, `inseam`, `neck` (all numeric, nullable individually — a customer may not have filled in every field yet).
- Order status enum: `requested`, `needs_changes`, `quoted`, `declined`, `confirmed`, `cutting`, `stitching`, `ready`, `completed`.
- Every failed `apiFetch` call (any non-2xx response, any network error) surfaces as a toast at the top of the page — on both the customer and admin side — rather than a silent failure or an inline-only error. This is wired once in `apiFetch` itself (Task 11), so no individual page implements its own error display.

## Review Focus

- An order status transition attempted from the wrong state (quoting an already-`confirmed` order, confirming/declining an order that isn't `quoted`) must be rejected, not silently applied. → Tasks 6, 7, 8.
- A customer reading or modifying another customer's data (order, measurements, notification) must be rejected (403/404), not just "logged in as someone." → Tasks 4, 5, 9.
- A forged or tampered SSLCommerz callback (unknown transaction, mismatched amount) must not mark an order's advance as paid. → Task 8.
- An order submitted with a `garment_type` outside the fixed list, or missing a required field, must be rejected rather than stored as-is. → Task 5.
- Signing up with an email that's already registered must return a clear conflict error, not create a duplicate account or crash. → Task 2.

---

## Task 1: Database schema and test infrastructure

**Files:**
- Create: `backend/db/schema.sql`
- Create: `backend/db/migrate.js`
- Create: `backend/db/seedAdmin.js`
- Modify: `backend/package.json` (scripts: `db:migrate`, `db:seed:admin`, `test`; deps: `supertest`, devDep)
- Modify: `backend/.env.example`, `backend/.env` (add `TEST_DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Create: `backend/tests/helpers/db.js`
- Test: `backend/tests/schema.test.js`

**Interfaces:**
- Produces: `pool` (existing, from `backend/db/pool.js`) stays the production pool; `backend/tests/helpers/db.js` exports `testPool` (a `pg.Pool` built from `TEST_DATABASE_URL`) and `async function resetTables()` that `TRUNCATE`s all app tables (`notifications, payments, order_status_history, orders, measurements, users RESTART IDENTITY CASCADE`).
- Later tasks' tests import `{ testPool, resetTables }` from this helper and call `resetTables()` in `beforeEach`.

- [ ] **Step 1: Write `backend/db/schema.sql`**

Six `CREATE TABLE IF NOT EXISTS` statements, in FK order: `users`, `measurements`, `orders`, `order_status_history`, `payments`, `notifications` — fields exactly as listed in the design doc's "Decided: data model" section, plus the `fabric_note` field and the enums fixed in Global Constraints above, enforced with `CHECK` constraints (e.g. `status IN ('requested', 'needs_changes', ...)`, `garment_type IN (...)`, `role IN ('customer','admin')`).

- [ ] **Step 2: Write `backend/db/migrate.js`**

```js
// Reads schema.sql and runs it against process.env.DATABASE_URL.
// Usage: node db/migrate.js
```

- [ ] **Step 3: Add `TEST_DATABASE_URL` to `.env.example` and `.env`**

`TEST_DATABASE_URL=postgres://tailortrack:tailortrack@localhost:5432/tailortrack_test`

- [ ] **Step 4: Write `backend/tests/helpers/db.js`**

`testPool` connects with `TEST_DATABASE_URL`. `resetTables()` truncates all six tables.

- [ ] **Step 5: Write the failing test `backend/tests/schema.test.js`**

```js
test("migration creates all six tables", async () => {
  const { rows } = await testPool.query(
    `select table_name from information_schema.tables where table_schema = 'public'`
  );
  const names = rows.map(r => r.table_name).sort();
  assert.deepEqual(names, [
    "measurements", "notifications", "order_status_history",
    "orders", "payments", "users",
  ]);
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `docker compose up -d db && createdb -h localhost -U tailortrack tailortrack_test` (or `psql ... -c "create database tailortrack_test"`), then `npm test --workspace=backend`
Expected: FAIL (no tables yet)

- [ ] **Step 7: Run the migration against the test database, then re-run the test**

Run: `TEST_DATABASE_URL=$TEST_DATABASE_URL node backend/db/migrate.js` (point `migrate.js` at `TEST_DATABASE_URL` for this one run — see note below), then `npm test --workspace=backend`

Note: `migrate.js` reads `DATABASE_URL`; for the test database, temporarily export `DATABASE_URL=$TEST_DATABASE_URL` before running it once. Document this one-liner in the task, no script flag needed for a project this size.

Expected: PASS

- [ ] **Step 8: Write `backend/db/seedAdmin.js`**

Reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` from env, hashes the password with `bcrypt`, and `INSERT ... ON CONFLICT (email) DO NOTHING` into `users` with `role = 'admin'`. No test required (it's a one-shot ops script); run it manually once per environment (`node db/seedAdmin.js`) and note that in `README.md`.

- [ ] **Step 9: Add npm scripts to `backend/package.json`**

`"db:migrate": "node db/migrate.js"`, `"db:seed:admin": "node db/seedAdmin.js"`, `"test": "node --test tests/"`. Add `supertest` to `devDependencies`.

- [ ] **Step 10: Commit**

```bash
git add backend/db backend/tests backend/package.json backend/.env.example README.md
git commit -m "feat: database schema, migration script, admin seed, test infra"
```

---

## Task 2: Auth (signup, login, JWT, admin seed verification)

**Files:**
- Create: `backend/controllers/auth.controller.js`
- Create: `backend/routes/auth.routes.js`
- Create: `backend/middlewares/requireAuth.js`
- Create: `backend/middlewares/requireAdmin.js`
- Modify: `backend/app.js` (mount `authRoutes`)
- Test: `backend/tests/auth.test.js`

**Interfaces:**
- Consumes: `testPool`, `resetTables` (Task 1); `pool` from `backend/db/pool.js`.
- Produces: `requireAuth(req, res, next)` — verifies the JWT, sets `req.user = { id, role }`, else 401. `requireAdmin(req, res, next)` — runs after `requireAuth`, 403 if `req.user.role !== 'admin'`. `signToken({ id, role })` exported from `auth.controller.js` for later tasks' tests that need a token without hitting `/auth/login`.

- [ ] **Step 1: Write failing tests for signup**

```js
test("signup creates a customer and returns a token", async () => {
  const res = await request(app).post("/auth/signup")
    .send({ name: "Rafi", email: "rafi@example.com", password: "secret123" });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
});

test("signup with an already-used email returns 409", async () => {
  await request(app).post("/auth/signup").send({ name: "A", email: "dup@example.com", password: "secret123" });
  const res = await request(app).post("/auth/signup").send({ name: "B", email: "dup@example.com", password: "secret123" });
  assert.equal(res.status, 409);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend`
Expected: FAIL (route not defined)

- [ ] **Step 3: Implement `signup(req, res)`, `login(req, res)`, `signToken({id, role})` in `auth.controller.js`**

`signup`: validate name/email/password present, hash password with `bcrypt.hash(password, 10)`, insert with `role = 'customer'` (signup is always customer — the admin is seeded, per Task 1 Step 8), catch the unique-violation Postgres error (code `23505`) and respond 409. `login`: look up by email, `bcrypt.compare`, sign and return a JWT (`jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" })`). Both respond `{ token, user: { id, name, role } }` on success.

- [ ] **Step 4: Implement `requireAuth` and `requireAdmin` middlewares**

`requireAuth` reads `Authorization: Bearer <token>`, `jwt.verify`, 401 on missing/invalid. `requireAdmin` checks `req.user.role`.

- [ ] **Step 5: Wire `auth.routes.js` (`POST /auth/signup`, `POST /auth/login`) and mount in `app.js`**

- [ ] **Step 6: Write and run the remaining tests (login success, login wrong password → 401, protected route without token → 401)**

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/controllers/auth.controller.js backend/routes/auth.routes.js backend/middlewares backend/app.js backend/tests/auth.test.js
git commit -m "feat: signup, login, JWT auth middleware"
```

---

## Task 3: Notifications (service + endpoints, including admin custom message)

**Files:**
- Create: `backend/services/notifications.service.js`
- Create: `backend/controllers/notifications.controller.js`
- Create: `backend/routes/notifications.routes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/notifications.test.js`

**Interfaces:**
- Consumes: `requireAuth`, `requireAdmin` (Task 2); `pool`.
- Produces: `async function notify({ sender, recipientId, message, orderId = null })` in `notifications.service.js` — inserts a row, returns it. Later tasks (5–8) import and call this directly from their own controllers; this task does not wire any automatic triggers itself.

- [ ] **Step 1: Write failing test for the service function**

```js
test("notify() inserts a notification row", async () => {
  const user = await insertTestUser({ role: "customer" }); // test helper, add alongside this test
  const n = await notify({ sender: "system", recipientId: user.id, message: "hello" });
  assert.equal(n.is_read, false);
  assert.equal(n.message, "hello");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend`
Expected: FAIL

- [ ] **Step 3: Implement `notify()` in `notifications.service.js`**

Plain `INSERT INTO notifications (...) VALUES (...) RETURNING *`.

- [ ] **Step 4: Write failing tests for the three endpoints**

```js
test("GET /me/notifications returns only the caller's notifications", ...);
test("PATCH /me/notifications/:id marks it read, and rejects marking someone else's", ...); // 404 on someone else's id
test("POST /admin/notifications sends a custom message to a given customer, admin-only", ...); // 403 for a customer caller
```

- [ ] **Step 5: Implement `getMyNotifications`, `markNotificationRead`, `sendCustomNotification` in `notifications.controller.js`**

`markNotificationRead`: `UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2` — zero rows affected means not-yours-or-doesn't-exist, respond 404 either way (no 403, so existence isn't leaked). `sendCustomNotification` calls `notify({ sender: "admin", recipientId: req.body.customerId, message: req.body.message, orderId: req.body.orderId ?? null })`.

- [ ] **Step 6: Wire routes and mount in `app.js`**

`GET /me/notifications`, `PATCH /me/notifications/:id` (both `requireAuth`); `POST /admin/notifications` (`requireAuth`, `requireAdmin`).

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/services backend/controllers/notifications.controller.js backend/routes/notifications.routes.js backend/app.js backend/tests/notifications.test.js
git commit -m "feat: notification service, list/mark-read, admin custom message"
```

---

## Task 4: Measurements

**Files:**
- Create: `backend/controllers/measurements.controller.js`
- Create: `backend/routes/measurements.routes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/measurements.test.js`

**Interfaces:**
- Consumes: `requireAuth` (Task 2).
- Produces: nothing new consumed by later tasks directly — Task 5 reads measurements by writing its own `SELECT` against the `measurements` table, not through this controller.

- [ ] **Step 1: Write failing tests**

```js
test("GET /me/measurements returns null fields before any PUT", ...);
test("PUT /me/measurements upserts the seven fields and GET then reflects them", ...);
test("PUT with a non-numeric value for a field returns 400", ...); // e.g. chest: "abc"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend`
Expected: FAIL

- [ ] **Step 3: Implement `getMyMeasurements`, `putMyMeasurements` in `measurements.controller.js`**

`putMyMeasurements`: validate each of the seven fields is `undefined`, `null`, or a finite number; `INSERT ... ON CONFLICT (customer_id) DO UPDATE SET ...` (needs a unique constraint on `measurements.customer_id` — add it in a short follow-up edit to `schema.sql` from Task 1, re-run `migrate.js` against both databases).

- [ ] **Step 4: Wire routes (`GET /me/measurements`, `PUT /me/measurements`, both `requireAuth`) and mount**

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/measurements.controller.js backend/routes/measurements.routes.js backend/app.js backend/db/schema.sql backend/tests/measurements.test.js
git commit -m "feat: customer measurement profile"
```

---

## Task 5: Order creation and listing

**Files:**
- Create: `backend/controllers/orders.controller.js`
- Create: `backend/routes/orders.routes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/orders.create.test.js`

**Interfaces:**
- Consumes: `requireAuth`; `notify()` (Task 3).
- Produces: `createOrder`, `listMyOrders`, `getOrderById` exported from `orders.controller.js` — Tasks 6–8 add more exports to this same file (reject/quote/edit/decline/confirm/advance-stage) rather than creating new controller files, since they all operate on the one `orders` resource.

- [ ] **Step 1: Write failing tests**

```js
test("POST /orders creates a requested order and snapshots current measurements", async () => {
  // PUT measurements first, then POST an order, then assert the order's snapshot matches
});
test("POST /orders with an invalid garment_type returns 400", ...); // e.g. "tuxedo"
test("POST /orders with garment_type 'other' requires a non-empty note", ...);
test("GET /orders returns only the caller's own orders", ...);
test("GET /orders/:id on someone else's order returns 404", ...);
test("POST /orders notifies the admin", async () => {
  // after creating an order, assert a notifications row exists with sender='system', recipient_id = admin's id
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend`
Expected: FAIL

- [ ] **Step 3: Implement `createOrder(req, res)`**

Validates `garment_type` against the fixed list (Global Constraints), `priority` against `normal|fast|urgent` (default `normal`), reads the caller's current `measurements` row to snapshot onto the order as a JSON column (`measurements_snapshot jsonb` — add this column to `schema.sql` in this task, since Task 1's schema listed the snapshot conceptually but didn't fix its storage shape), inserts the order with `status = 'requested'`, inserts an `order_status_history` row (`from_status: null, to_status: 'requested', changed_by: 'customer'`), then calls `notify({ sender: "system", recipientId: <the seeded admin's id>, message: "New order #<id> from <customer name>", orderId: <id> })`.

- [ ] **Step 4: Implement `listMyOrders(req, res)` and `getOrderById(req, res)`**

Both filter `WHERE customer_id = $1`; `getOrderById` responds 404 (not 403) when the row exists but belongs to someone else, so existence isn't leaked.

- [ ] **Step 5: Wire routes (`POST /orders`, `GET /orders`, `GET /orders/:id`, all `requireAuth`) and mount**

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/controllers/orders.controller.js backend/routes/orders.routes.js backend/app.js backend/db/schema.sql backend/tests/orders.create.test.js
git commit -m "feat: order creation, listing, admin notification on new request"
```

---

## Task 6: Admin review — reject and quote

**Files:**
- Modify: `backend/controllers/orders.controller.js` (add `rejectOrder`, `quoteOrder`, `listAllOrders`)
- Modify: `backend/routes/orders.routes.js`
- Test: `backend/tests/orders.adminReview.test.js`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2); `notify()` (Task 3); shares the `orders` table with Task 5.
- Produces: a shared internal helper `transitionOrder({ orderId, toStatus, changedBy, note })` — writes the status + an `order_status_history` row in one place; Tasks 7 and 8 reuse this helper instead of duplicating the history-insert logic.

- [ ] **Step 1: Write failing tests**

```js
test("PATCH /admin/orders/:id/reject moves requested -> needs_changes with the given note, non-admin gets 403", ...);
test("rejecting a non-requested order (e.g. already quoted) returns 409", ...);
test("PATCH /admin/orders/:id/quote sets due_date/quoted_price/advance_required and moves requested -> quoted", ...);
test("quote on a non-requested order returns 409", ...);
test("both reject and quote notify the customer", ...);
test("GET /admin/orders filters by ?status=requested, admin-only", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend`
Expected: FAIL

- [ ] **Step 3: Implement `transitionOrder({ orderId, toStatus, changedBy, note })` helper**

Single SQL statement updates `orders.status` guarded by `WHERE id = $1 AND status = $fromStatusImpliedByCaller` is error-prone across callers with different "from" states; instead: read the current status first, validate the caller's expected "from" state matches (throw a typed error the controller maps to 409 if not), then `UPDATE orders SET status = $2 ... WHERE id = $1` and `INSERT INTO order_status_history (...)` in the same function, both inside one `pool` client transaction (`BEGIN`/`COMMIT`).

- [ ] **Step 4: Implement `rejectOrder(req, res)` and `quoteOrder(req, res)`**

Both require the current status to be `requested` (else 409). `rejectOrder` calls `transitionOrder({ toStatus: "needs_changes", changedBy: "admin", note: req.body.reason })` then `notify(...)` to the customer with that reason as the message. `quoteOrder` validates `due_date`, `quoted_price`, `advance_required` are all present and `advance_required <= quoted_price`, sets those three columns alongside `transitionOrder({ toStatus: "quoted", changedBy: "admin" })`, then `notify(...)` the customer with a summary invoice message.

- [ ] **Step 5: Implement `listAllOrders(req, res)`**

Optional `?status=` query filter; no filter returns all.

- [ ] **Step 6: Wire routes (`GET /admin/orders`, `PATCH /admin/orders/:id/reject`, `PATCH /admin/orders/:id/quote`, all `requireAuth` + `requireAdmin`)**

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/controllers/orders.controller.js backend/routes/orders.routes.js backend/tests/orders.adminReview.test.js
git commit -m "feat: admin reject/quote, order transition helper, admin order listing"
```

---

## Task 7: Customer response — edit/resubmit and decline

**Files:**
- Modify: `backend/controllers/orders.controller.js` (add `patchOrder`, `declineOrder`)
- Modify: `backend/routes/orders.routes.js`
- Test: `backend/tests/orders.customerResponse.test.js`

**Interfaces:**
- Consumes: `transitionOrder` (Task 6); `notify()` (Task 3).

- [ ] **Step 1: Write failing tests**

```js
test("PATCH /orders/:id edits garment_type/style_notes/fabric_note/priority while needs_changes, and moves it back to requested", ...);
test("PATCH /orders/:id on an order not in needs_changes returns 409", ...);
test("PATCH /orders/:id on someone else's order returns 404", ...);
test("PATCH /orders/:id never changes due_date/quoted_price/advance_required even if sent in the body", ...);
test("POST /orders/:id/decline moves quoted -> declined, admin gets notified", ...);
test("decline on a non-quoted order returns 409", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend`
Expected: FAIL

- [ ] **Step 3: Implement `patchOrder(req, res)`**

Requires current status `needs_changes` and `customer_id = req.user.id` (else 404). Only reads `garment_type`, `style_notes`, `fabric_note`, `priority` off the body — ignores any other field silently (never trusts the client for price/date). Re-snapshots measurements (customer's profile may have changed). Calls `transitionOrder({ toStatus: "requested", changedBy: "customer" })`.

- [ ] **Step 4: Implement `declineOrder(req, res)`**

Requires current status `quoted` and ownership. `transitionOrder({ toStatus: "declined", changedBy: "customer" })`, then `notify()` the admin.

- [ ] **Step 5: Wire routes (`PATCH /orders/:id`, `POST /orders/:id/decline`, both `requireAuth`)**

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/controllers/orders.controller.js backend/routes/orders.routes.js backend/tests/orders.customerResponse.test.js
git commit -m "feat: customer edit/resubmit and decline-invoice flows"
```

---

## Task 8: Payment — SSLCommerz sandbox advance + manual balance

**Files:**
- Create: `backend/services/sslcommerz.service.js`
- Create: `backend/controllers/payments.controller.js`
- Create: `backend/routes/payments.routes.js`
- Modify: `backend/controllers/orders.controller.js` (add `advanceStage` is Task 9 — this task only touches payments; no edit needed here beyond what Task 6/7 already added)
- Modify: `backend/app.js`, `backend/.env.example`, `backend/.env`
- Test: `backend/tests/payments.test.js`

**Interfaces:**
- Consumes: `transitionOrder` (Task 6); `notify()` (Task 3); `requireAuth`, `requireAdmin`.
- Produces: `initSslcommerzSession({ order })` and `validateSslcommerzTransaction({ tranId, valId })` exported from `sslcommerz.service.js`, both thin wrappers the controller calls — tests stub these two functions (via `node:test`'s `t.mock.method`) rather than hitting the real SSLCommerz sandbox over the network, so the suite stays fast and offline-runnable; a short manual QA note (not an automated test) is left at the end of this task to click through the real sandbox once.

- [ ] **Step 1: Add SSLCommerz sandbox env vars to `.env.example`/`.env`**

`SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE=false` — left blank in `.env.example`; the user fills in their own free sandbox store credentials in `.env` before this task's manual QA step (Step 7).

- [ ] **Step 2: Write failing tests**

```js
test("POST /orders/:id/confirm on a quoted order calls initSslcommerzSession and returns its gateway URL", async (t) => {
  t.mock.method(sslcommerzService, "initSslcommerzSession", async () => ({ gatewayUrl: "https://sandbox.../pay/abc" }));
  // ...
});
test("confirm on a non-quoted order returns 409", ...);
test("POST /payments/sslcommerz/callback with a validated success marks the advance paid and the order confirmed", async (t) => {
  t.mock.method(sslcommerzService, "validateSslcommerzTransaction", async () => ({ valid: true, amount: 1500 }));
  // assert a payments row exists with type='advance', gateway_transaction_id set, and orders.status === 'confirmed'
});
test("callback with validateSslcommerzTransaction returning invalid does NOT mark the order confirmed", ...); // the forged-callback case from Review Focus
test("callback reporting failed/cancelled leaves the order in 'quoted'", ...);
test("POST /admin/orders/:id/payments records a manual balance payment, admin-only, no gateway_transaction_id", ...);
```

- [ ] **Step 3: Implement `sslcommerz.service.js`**

`initSslcommerzSession({ order })`: builds the SSLCommerz `init` request (`total_amount: order.advance_required`, a generated unique `tran_id`, `success_url`/`fail_url`/`cancel_url` pointing at this app's callback route) using the official `sslcommerz-lts` package with `is_live: process.env.SSLCOMMERZ_IS_LIVE === "true"`, returns `{ gatewayUrl, tranId }`. `validateSslcommerzTransaction({ tranId, valId })`: calls SSLCommerz's order-validation API, returns `{ valid, amount }`.

- [ ] **Step 4: Implement `confirmOrder(req, res)` and `sslcommerzCallback(req, res)` in `payments.controller.js`**

`confirmOrder`: requires status `quoted` and ownership (404 otherwise), calls `initSslcommerzSession`, stores the generated `tranId` on the order (add a nullable `pending_tran_id` column to `schema.sql` in this task) so the callback can match it back, returns the gateway URL for the frontend to redirect to. `sslcommerzCallback`: looks up the order by `pending_tran_id`, calls `validateSslcommerzTransaction`; on `valid && amount === order.advance_required`, inserts the `payments` row (`type: "advance"`, `gateway_transaction_id: tranId`) and `transitionOrder({ toStatus: "confirmed", changedBy: "system" })`, then `notify()` the customer; on invalid or amount mismatch, does nothing to the order's status (stays `quoted`) and logs the discrepancy.

- [ ] **Step 5: Implement `recordBalancePayment(req, res)` in `payments.controller.js`**

Admin-only; inserts a `payments` row (`type: "balance"`, `gateway_transaction_id: null`, `amount` from body) for the given order; no status change (balance recording is independent of production stage).

- [ ] **Step 6: Wire routes and mount**

`POST /orders/:id/confirm` (`requireAuth`), `POST /payments/sslcommerz/callback` (no auth — this is SSLCommerz's own server calling in, authenticated instead by validating the transaction with SSLCommerz itself in Step 4), `POST /admin/orders/:id/payments` (`requireAuth`, `requireAdmin`).

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

Manual QA (not automated, do once): with real sandbox credentials in `.env`, call `POST /orders/:id/confirm` against a locally running server, open the returned `gatewayUrl` in a browser, complete SSLCommerz's sandbox test-card flow, and confirm the callback actually lands and flips the order to `confirmed`.

- [ ] **Step 8: Commit**

```bash
git add backend/services/sslcommerz.service.js backend/controllers/payments.controller.js backend/routes/payments.routes.js backend/app.js backend/db/schema.sql backend/.env.example backend/tests/payments.test.js
git commit -m "feat: SSLCommerz sandbox advance payment, manual balance recording"
```

---

## Task 9: Production stage progression

**Files:**
- Modify: `backend/controllers/orders.controller.js` (add `advanceStage`)
- Modify: `backend/routes/orders.routes.js`
- Test: `backend/tests/orders.stages.test.js`

**Interfaces:**
- Consumes: `transitionOrder` (Task 6); `notify()` (Task 3).

- [ ] **Step 1: Write failing tests**

```js
test("PATCH /admin/orders/:id/status confirmed -> cutting succeeds, customer notified, optional note included in the history row", ...);
test("attempting to skip a stage (confirmed -> stitching) returns 409", ...);
test("attempting to advance a declined or needs_changes order returns 409", ...);
test("non-admin gets 403", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend`
Expected: FAIL

- [ ] **Step 3: Implement `advanceStage(req, res)`**

Fixed sequence `confirmed → cutting → stitching → ready → completed`; looks up the current status, computes the one valid next status, rejects (409) if the body's `toStatus` isn't exactly that next one. Calls `transitionOrder({ toStatus, changedBy: "admin", note: req.body.note ?? null })`, then `notify()` the customer.

- [ ] **Step 4: Wire route (`PATCH /admin/orders/:id/status`, `requireAuth` + `requireAdmin`)**

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/orders.controller.js backend/routes/orders.routes.js backend/tests/orders.stages.test.js
git commit -m "feat: sequential production stage advancement"
```

---

## Task 10: Reports

**Files:**
- Create: `backend/controllers/reports.controller.js`
- Create: `backend/routes/reports.routes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/reports.test.js`

**Interfaces:**
- Consumes: `requireAdmin`.

- [ ] **Step 1: Write failing test**

```js
test("GET /admin/reports returns order counts per status and payment totals", async () => {
  // fixture: two orders quoted at 1000 and 2000, one with a 300 advance paid, the other with a 500 advance + 200 balance paid
  const res = await request(app).get("/admin/reports").set("Authorization", adminAuth);
  assert.equal(res.body.ordersByStatus.quoted, 2);
  assert.equal(res.body.totals.collected, 1000); // 300 + 500 + 200
  assert.equal(res.body.totals.outstanding, 2000); // (1000-300) + (2000-700)
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend`
Expected: FAIL

- [ ] **Step 3: Implement `getReports(req, res)`**

Two SQL queries: `SELECT status, count(*) FROM orders GROUP BY status`, and a join/aggregate over `orders` + `payments` for `collected` (sum of all payments) and `outstanding` (sum of `quoted_price - COALESCE(paid_per_order, 0)` over orders that have a `quoted_price`).

- [ ] **Step 4: Wire route (`GET /admin/reports`, `requireAuth` + `requireAdmin`) and mount**

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/reports.controller.js backend/routes/reports.routes.js backend/app.js backend/tests/reports.test.js
git commit -m "feat: admin reports endpoint"
```

---

## Task 11: Frontend infrastructure and auth

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/app/AuthContext.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Create: `frontend/src/pages/Login.jsx`, `frontend/src/pages/Signup.jsx`
- Modify: `frontend/src/app/App.jsx` (routing)
- Modify: `frontend/package.json` (add `react-router-dom`, `react-hot-toast`, devDeps `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`), `frontend/vite.config.js` (test config)
- Modify: `frontend/src/main.jsx` (mount `<Toaster />` once, at the app root)
- Delete: `frontend/src/pages/ConnectivityCheck.jsx` (superseded — its job is done; `npm run dev` from here on shows real pages)
- Test: `frontend/src/pages/Login.test.jsx`, `frontend/src/api/client.test.js`

**Interfaces:**
- Produces: `apiFetch(path, options)` in `client.js` — wraps `fetch`, prefixes `VITE_API_URL`, attaches the stored JWT as `Authorization: Bearer <token>` when present; on any non-2xx response or network failure, calls `toast.error(message)` (from `react-hot-toast`) with the server's JSON error message (or a generic "Something went wrong" on a network error) and re-throws, so callers can still branch on the error without re-displaying it themselves. `useAuth()` hook from `AuthContext.jsx` returns `{ user, token, login(email, password), signup(...), logout() }` and persists the token to `localStorage`. All later frontend tasks call the backend exclusively through `apiFetch`, and never render their own error text for a failed request — the toast is the one error surface, for both the customer and admin side.

- [ ] **Step 1: Add test tooling and the toast library**

`npm install react-hot-toast && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom --workspace=frontend`; add `test: "vitest run"` to `frontend/package.json` scripts and a `test: { environment: "jsdom" }` block to `vite.config.js`.

- [ ] **Step 2: Write the failing tests**

```jsx
test("submitting the login form calls apiFetch and stores the returned token", async () => {
  // mock apiFetch to resolve { token: "abc", user: { role: "customer" } }
  // render <Login />, fill email/password, submit
  // assert localStorage.getItem("token") === "abc"
});
```

```js
test("apiFetch shows a toast and rethrows on a non-2xx response", async () => {
  // mock global fetch to resolve { ok: false, status: 400, json: async () => ({ message: "Bad request" }) }
  // spy on toast.error from react-hot-toast
  // assert apiFetch(...) rejects, and toast.error was called with "Bad request"
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test --workspace=frontend`
Expected: FAIL

- [ ] **Step 4: Implement `apiFetch`, `AuthContext`/`useAuth`, `ProtectedRoute`, `Login`, `Signup`, and mount `<Toaster position="top-center" />` once in `main.jsx`**

`ProtectedRoute` redirects to `/login` when `useAuth().token` is empty; takes an optional `role` prop to also gate by `user.role`. `App.jsx` wires `react-router-dom` routes: `/login`, `/signup`, and protected `/` (role-dependent landing, built out in Tasks 12/13).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test --workspace=frontend`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src frontend/package.json frontend/vite.config.js
git commit -m "feat: frontend routing, auth context, login/signup pages"
```

---

## Task 12: Customer pages

**Files:**
- Create: `frontend/src/pages/Measurements.jsx`
- Create: `frontend/src/pages/NewOrder.jsx`
- Create: `frontend/src/pages/MyOrders.jsx`
- Create: `frontend/src/pages/OrderDetail.jsx`
- Create: `frontend/src/pages/Notifications.jsx`
- Create: `frontend/src/components/OrderStatusBadge.jsx`
- Modify: `frontend/src/app/App.jsx` (customer routes)
- Test: `frontend/src/pages/MyOrders.test.jsx`, `frontend/src/pages/OrderDetail.test.jsx`

**Interfaces:**
- Consumes: `apiFetch`, `useAuth` (Task 11).

- [ ] **Step 1: Write failing tests**

```jsx
test("MyOrders renders each order's garment type and status badge", ...);
test("OrderDetail shows Confirm/Decline buttons only when status is 'quoted'", ...);
test("OrderDetail shows an editable form (not just a view) only when status is 'needs_changes'", ...);
test("clicking Confirm calls POST /orders/:id/confirm and redirects the browser to the returned gatewayUrl", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=frontend`
Expected: FAIL

- [ ] **Step 3: Implement the five pages and `OrderStatusBadge`**

`Measurements`: a form for the seven fields, `GET`/`PUT /me/measurements`. `NewOrder`: `garment_type` select (the fixed list), `fabric_note`, `style_notes`, `priority` radio group, `POST /orders`. `MyOrders`: list from `GET /orders`, each row links to `OrderDetail`. `OrderDetail`: `GET /orders/:id`; status-conditional UI — `needs_changes` shows an edit form (`PATCH /orders/:id`), `quoted` shows the invoice (due date, price, advance) with Confirm/Decline buttons, everything else is read-only status display. `Notifications`: list from `GET /me/notifications`, clicking a row calls `PATCH /me/notifications/:id`.

- [ ] **Step 4: Wire customer routes in `App.jsx`**

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test --workspace=frontend`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat: customer measurements, order submission, order detail, notifications pages"
```

---

## Task 13: Admin pages

**Files:**
- Create: `frontend/src/pages/AdminOrderBoard.jsx`
- Create: `frontend/src/pages/AdminOrderDetail.jsx`
- Create: `frontend/src/pages/AdminReports.jsx`
- Modify: `frontend/src/app/App.jsx` (admin routes)
- Test: `frontend/src/pages/AdminOrderDetail.test.jsx`

**Interfaces:**
- Consumes: `apiFetch`, `useAuth`, `OrderStatusBadge` (Tasks 11–12).

- [ ] **Step 1: Write failing tests**

```jsx
test("AdminOrderDetail on a 'requested' order shows Reject (with a reason field) and Quote (due date/price/advance fields) actions", ...);
test("submitting Quote calls PATCH /admin/orders/:id/quote with the three fields", ...);
test("AdminOrderDetail on a 'confirmed' order shows only the single valid next-stage button ('Cutting')", ...);
test("AdminOrderDetail includes a manual balance-payment form and a custom-notification composer", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=frontend`
Expected: FAIL

- [ ] **Step 3: Implement the three pages**

`AdminOrderBoard`: `GET /admin/orders`, a status filter dropdown, each row links to detail. `AdminOrderDetail`: status-conditional actions mirroring the backend's allowed transitions exactly (`requested` → reject/quote forms; `quoted` → read-only, waiting on the customer; `confirmed`.."ready" → one next-stage button computed the same way the backend does; always-available: record-balance-payment form and a custom-notification composer (`POST /admin/notifications`) addressed to this order's customer). `AdminReports`: renders `GET /admin/reports`'s counts and totals as a simple table (no charting library — a plain table is enough here, per the project's "no overengineering" stance).

- [ ] **Step 4: Wire admin routes in `App.jsx`**

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test --workspace=frontend`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat: admin order board, order review/production actions, reports page"
```

---

## Self-Review

**Spec coverage:** Auth/signup/login (Task 2), measurement profile (Task 4), request submission with `fabric_note`/priority (Task 5), full lifecycle including reject/edit/resubmit and quote/decline (Tasks 6–7), SSLCommerz advance + manual balance (Task 8), sequential production stages (Task 9), notifications including the admin custom-message feature (Task 3), reports (Task 10), both role's UIs (Tasks 11–13). No section of the design doc is without a task.

**Type/name consistency check:** `transitionOrder` (introduced Task 6) is reused with the same signature in Tasks 7, 8, 9. `notify()` (Task 3) is reused with the same signature in Tasks 5–9. `apiFetch`/`useAuth` (Task 11) are reused with the same names in Tasks 12–13. `OrderStatusBadge` (Task 12) is reused in Task 13.

**Review Focus coverage:** all five items are each assigned to a specific task's tests above, not left as a general aspiration.

**Proportion:** 13 tasks against a design doc with nine data-model fields' worth of state machine, five endpoint groups, and two role UIs — each task maps to one clearly separable slice (one table concern, one lifecycle transition pair, or one page group), and step bodies are signatures/test-names/assertions rather than full implementations.
