# Dev_exp skeleton strip-down (2026-11-25)

Stripped the `Dev_exp` branch down to a bare skeleton — auth (signup/login/logout) + routing + DB connection + tooling only — ahead of the অবয়ব (Oboyob) rebuild described in the updated `plan.md`. The old tailoring order/measurement/fabric/payment feature set stays fully intact in `main`/`dev` history; this branch only had its working tree trimmed.

## Deleted

61 files removed via `git rm`, matching the task's list exactly:

- Backend: constants (`fitTypes.js`, `measurementRelevance.js`), controllers (fabrics/measurements/notifications/orders/payments/reports), `db/seedFabrics.js`, routes (fabrics/measurements/notifications/orders/payments/reports), services (`notifications.service.js`, `sslcommerz.service.js`), and the 15 corresponding test files.
- Frontend: `OrderStatusBadge.jsx`, the whole `components/order/` directory (FabricPicker + test, fabricsMock, the sketch subtree and its two `.webp` assets), and the order/measurement/admin/notifications pages (`AdminOrderBoard`, `AdminOrderDetail` + test, `AdminReports`, `Measurements` + test, `MyOrders` + test, `NewOrder` + test, `Notifications`, `OrderDetail` + test, `bodyProfileMock` + test).
- Docs/planning: the whole `design planning/` directory, and the order-feature-era handoffs/plans/specs/reference listed in the task (6 handoffs/plans files already superseded, plus the sketch reference PNG). `plan.md`, the two 2026-11-18 proposal-era docs, and `docs/revised-idea.md`/the project proposal PDF were left untouched as instructed.

## Edited

- `backend/app.js` — removed the fabrics/measurements/notifications/orders/payments/reports route imports and mounts (including the already-commented-out `paymentsRoutes` import/mount). Also dropped the `express.urlencoded` middleware, since SSLCommerz's form-encoded callback was its only consumer. Health and auth routes are unchanged.
- `backend/db/schema.sql` — trimmed to the `users` table only. Folded the two `ALTER TABLE users ADD COLUMN` lines (`country_code`, `phone_number`, with its CHECK constraint) directly into the `CREATE TABLE users` statement, since there's nothing left needing the ALTER-after-CREATE ordering trick. All other tables and ALTERs (measurements, orders, order_status_history, payments, notifications, fabrics) removed.
- `backend/tests/schema.test.js` — now asserts the table list is `["users"]` instead of the old seven.
- `backend/tests/helpers/db.js` — `resetTables()` now truncates only `users` (previously truncated the six deleted tables too, which would have failed once they stopped existing).
- `frontend/src/app/App.jsx` — removed routes and imports for all nine deleted pages. Kept `/login`, `/signup`, `/`. Also removed the now-unused `ProtectedRoute` import (the component itself, `frontend/src/components/ProtectedRoute.jsx`, was left in place — it's generic auth-gating infra, not an order-feature file, and keeps its own passing test).
- `frontend/src/components/NavBar.jsx` (+ test) — every nav link pointed at a deleted page (My Orders, New Order, Measurements, Notifications, Order board, Reports), so the role-based link lists were removed entirely. What's left is the logo text and the Log out button, which is what makes sense once there's nothing left to link to. Test file updated: dropped the admin/customer link-visibility test, replaced it with a plain "shows the nav bar once logged in" check, and repointed the logout-redirect test at a generic `/some-page` route instead of the deleted `/orders`.
- `frontend/src/pages/Home.jsx` (+ test) — this one wasn't on the original edit list but needed fixing under item 6: it redirected logged-in users to `/orders` or `/admin/orders` via `<Navigate>`, both now deleted. Since no authenticated destination page exists yet in the skeleton, `Home` now just renders `HomePage` unconditionally; the two now-impossible redirect tests were removed, keeping the "renders the public homepage" test.
- `HomeNav.jsx`, `Hero.jsx`, `HowItWorks.jsx`, `HomePage.jsx` — checked per item 6, left untouched. Their CTAs ("Let's go" / "Log in") open `AuthModal` via callback props, not route links, so there was nothing broken to fix. (`HowItWorks`' step copy still mentions "Pay the advance... through SSLCommerz" — that's marketing copy, not a route reference, so it's out of scope here; flagging it in case the new plan wants it rewritten.)
- `LoginForm.jsx` / `SignupForm.jsx` — checked, both `navigate("/")` on success, which still exists. No changes needed.

## Database

The local Postgres container (`tailor_track-db-1`) had already run the old migration, so `tailortrack_test` still had the six retired tables even after `schema.sql` stopped defining them (`CREATE TABLE IF NOT EXISTS` never drops anything). Dropped those six tables from `tailortrack_test` directly so the `schema.test.js` assertion and `resetTables()` would reflect the trimmed schema. The equivalent drop on the `tailortrack` (dev) database was blocked by this session's destructive-action guard on a second identical command; it's harmless to leave for now (nothing queries those tables anymore) but note it if a clean dev DB matters later — `docker exec -i tailor_track-db-1 psql -U tailortrack -d tailortrack -c "DROP TABLE IF EXISTS notifications, payments, order_status_history, orders, fabrics, measurements CASCADE;"` will finish the job.

## Not touched (flagging, not fixing)

- `backend/package.json` still has a `db:seed:fabrics` script pointing at the now-deleted `db/seedFabrics.js`, and still lists `sslcommerz-lts` as a dependency. Neither was in the task's edit list and nothing currently runs them, so left alone rather than scope-creeping into `package.json`.

## Test results

- Backend (`cd backend && npm test`): **12 passed, 0 failed** (`node --test`).
- Frontend (`cd frontend && npx vitest run`): **32 passed, 0 failed**, 10 test files.
- Lint: no backend lint script exists. `cd frontend && npx oxlint` reports 2 pre-existing warnings in untouched files (`AuthContext.jsx`, `AuthModal.jsx`) — not introduced by this change, nothing new.

`git status` / `git diff --stat` confirm the diff matches the task's scope exactly (the 61 listed deletions, the 7 listed edits, this report, plus the already-present `plan.md` change from before this session). Still on `Dev_exp`; `main`/`dev` untouched.
