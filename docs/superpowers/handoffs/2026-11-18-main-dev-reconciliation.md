# Handoff: reconcile `main` and `dev`

**Repo:** `github.com/Disa44ay/Tailor_TracK`. Read `CLAUDE.md` first (model roles, git workflow, auto-merge rule).

## What happened

`main` and `dev` diverged during an earlier session's Task 8/9/10 work and were never brought back in sync. A later session (this one) built Tasks 11-13 (the whole frontend) on top of `dev`, so `dev` now has the complete app but can't be merged into `main` with a plain `git merge` — a dry run finds real conflicts.

- `main`'s tip: `3a57a23` — has Tasks 1-7, a reverted attempt at Task 9 (stage advancement), Task 10 (reports), and the 14-field measurements migration. **It never got Task 8 (SSLCommerz payments), and Task 9 is missing** (added, broke, reverted, never fixed).
- `dev`'s tip: `7590b3c` — has Tasks 1-7 (same base), then Task 8, Task 9, Task 10, the 14-field migration, **then Tasks 11-13 (full frontend) plus a post-review fix pass**.
- Merge-base (where they split): `dfc8df8` (Task 7).

`dev` is strictly ahead and more complete — it is not a case of two competing designs, just `main` missing work that `dev` has.

## What needs to happen

1. **Confirm `dev` is really the complete, working version.** It should be — backend suite is 57/57 and frontend suite is 21/21 as of `7590b3c` — but verify before overwriting anything:
   ```bash
   git checkout dev && npm test --workspace=backend && npm test --workspace=frontend
   ```
2. **Merge `dev` into `main`**, resolving conflicts in favor of `dev`'s version (it's the complete one):
   ```bash
   git checkout main
   git merge --no-ff dev
   ```
   Conflicts will appear in exactly these 3 files (confirmed via `git merge-tree $(git merge-base main dev) main dev`):
   - `backend/app.js`
   - `backend/controllers/orders.controller.js`
   - `backend/db/schema.sql`

   For each, take `dev`'s side (`--theirs` from `main`'s perspective mid-merge) since `dev` is the complete version main is missing pieces of:
   ```bash
   git checkout --theirs backend/app.js backend/controllers/orders.controller.js backend/db/schema.sql
   git add backend/app.js backend/controllers/orders.controller.js backend/db/schema.sql
   ```
   Then **read the resolved files once** before committing — don't blindly trust `--theirs` gave a complete file; `orders.controller.js` in particular has grown across Tasks 5-9 plus this session's fix pass, so skim it end to end.
3. **Run both test suites again** against the merged result before committing the merge:
   ```bash
   npm test --workspace=backend
   npm test --workspace=frontend
   ```
   If anything fails, it's almost certainly a leftover from `main`'s side of a conflict — fix it, re-run, don't commit until green.
4. **Commit the merge** (don't use `--no-edit`; write a real merge commit message describing that this reconciles the diverged backend history) and push.
5. **Migrate the production/shared database if one exists separately from local dev.** The merge brings in `backend/db/schema.sql` changes (SSLCommerz columns, 14-field measurements, `pending_tran_id`, etc.) that may not all be applied everywhere `main` has been deployed. Run `node backend/db/migrate.js` against whatever `DATABASE_URL` matters before anyone relies on `main` in that environment.

## Known pre-existing gap (not part of reconciliation, just don't be surprised by it)

Task 8's SSLCommerz integration has never been tested against the real sandbox — `SSLCOMMERZ_STORE_ID`/`SSLCOMMERZ_STORE_PASSWORD` are blank in `.env`/`.env.example`. The code is implemented against the `sslcommerz-lts` package's own README and this session verified the redirect plumbing is correct (`backend/controllers/payments.controller.js`'s `sslcommerzReturn`, `backend/services/sslcommerz.service.js`'s `buildInitPayload`), but a live `Confirm` click currently returns an empty `gatewayUrl` with no credentials configured. Someone needs to sign up for a free SSLCommerz sandbox store, fill in those two env vars, and click through the real flow once.
