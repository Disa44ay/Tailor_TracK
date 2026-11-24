# Backend for the live-customization order flow — short design

**Intent:** support the frontend's locked design (body profile → fabric catalog → sketch with
measurement sliders) with the data it needs: height/weight/age on the customer's profile, a real
fabric catalog instead of free text, and an order record that captures the fabric and body profile
used at submit time.

**Goals:** the 4 pieces listed in the approved approach below. **Non-goals:** no image/sketch
generation or storage (frontend-only, per the locked schema handoff); no change to `fabric_note`'s
existing behavior; no change to any existing endpoint's behavior for callers that omit the new
fields.

**Constraints:** raw SQL via `pg`, no ORM; match existing patterns exactly (see each task below);
project's standing TDD and auto-merge rules apply.

**Approaches considered:** one sensible way — mirror the codebase's existing conventions for each
piece (ALTER-TABLE tail block, `FIELDS`/`COLUMNS` array + COALESCE partial update, route/controller
module pairing, `seedAdmin.js`-style seed script, snapshot-at-submit-time). No alternative considered
seriously; introducing a different pattern for any of these would be inconsistent with the rest of
the codebase for no benefit.

## What's decided

1. **Schema** (`backend/db/schema.sql`):
   - `measurements`: `height_cm numeric`, `weight_kg numeric`, `age integer CHECK (age IS NULL OR age > 0)`.
   - `fabrics` (new table): `id serial PK`, `name text NOT NULL`, `color_hex text NOT NULL CHECK (~ '^#[0-9a-fA-F]{6}$')`, `print_pattern text NOT NULL DEFAULT 'solid' CHECK (IN solid/striped/checked)`, `texture text NOT NULL CHECK (IN cotton/linen/silk/wool/denim)`, `swatch_image_url text`, `price_modifier numeric NOT NULL DEFAULT 0`, `is_active boolean NOT NULL DEFAULT true`, `created_at timestamptz NOT NULL DEFAULT now()`.
   - `orders`: `fabric_id integer REFERENCES fabrics(id)`, `body_profile_snapshot jsonb`.
2. **Measurements endpoints**: `heightCm`/`weightKg`/`age` added to the existing `FIELDS`/`COLUMNS`
   arrays in `measurements.controller.js` and to `ALL_MEASUREMENT_FIELDS` in
   `measurementRelevance.js`. Same partial-update (COALESCE) behavior as the other 14 fields.
3. **`GET /fabrics`**: new `fabrics.controller.js` (`getFabrics`) + `fabrics.routes.js`, returns
   active fabrics (`is_active = true`), wired into `app.js` alongside the other route modules.
   Requires auth (any logged-in user — customers need it to build an order), not admin-only.
4. **Seed script**: `backend/db/seedFabrics.js`, mirrors `seedAdmin.js` — a handful of sample
   fabrics (a few colors/textures/patterns) so there's real data to develop and test against.
5. **`POST /orders`**: `createOrder` accepts `fabricId` (validated: must exist and be active, 400
   otherwise), stores it on the order, and snapshots `body_profile_snapshot` (height/weight/age)
   from `measurements` the same way `measurements_snapshot` is already captured.

## What's left to the builder (none — this is fully specified)

Signatures, exact test cases, and file paths go in the implementation plan next.
