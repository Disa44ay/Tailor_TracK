# Handoff: live-customization order flow — what's wanted, proposed schema, what backend already supports

For: the frontend chat. Read `CLAUDE.md` first.

## What the user wants, in full (so nothing gets lost in relay)

When placing an order:
1. Customer enters **height, weight, age** once (part of their profile/measurements, not re-entered per order).
2. From that, a **body silhouette is generated automatically** — not uploaded, not a real photo, a sketch.
3. Customer picks a **garment type** (shirt/pant/suit/etc — already exists) and a **fabric** from a catalog (color/pattern — not free text).
4. The sketch **auto-renders**: body silhouette + chosen garment outline + chosen fabric's color/pattern, like a sketched product mockup.
5. Customer can then **slide every measurement** (chest, waist, sleeve length, etc — the 14 fields that already exist) and the **sketch updates live**, in the browser, as they drag.

**Resolved (locked 2026-11-21):** the sketch is a 2D illustrated SVG, not a live AI render and not physically simulated cloth. The frontend chat generated a reference illustration showing the level of detail wanted (fold lines at elbow/waist, a soft break where trouser meets shoe, a texture difference between a cotton-like panel and a smoother one) and confirmed the interaction model is **a few hand-drawn fit states per slider (e.g. slim/regular/relaxed) that cross-fade as the slider moves** — not a continuous physics redraw. This is entirely a frontend asset/rendering concern (which SVG states exist, how cross-fade blends them); the backend doesn't store or generate sketch images at all, it only supplies the data below that the frontend uses to pick which fabric look to apply.

## What the backend currently supports (as of commit `9de5473`)

- `PUT /me/measurements` — the 14 measurement fields (chest, waist, hip, shoulderWidth, sleeveLength, inseam, neck, bicep, wrist, thigh, knee, rise, hem, garmentLength), partial update, numbers only.
- `POST /orders` — `garmentType`, `styleNotes`, `fabricNote` (free text, not a catalog), `priority`, `fitType`, `lapelStyle`. Snapshots the customer's current measurements into `orders.measurements_snapshot` (jsonb) at submit time.
- Nothing for height/weight/age, nothing resembling a fabric catalog, no image/sketch generation anywhere.

## Proposed schema (not yet implemented — pending your confirmation on the question above, then goes through this project's normal brainstorming → plan → TDD process before it's built)

**`measurements` table — add 3 columns**, same pattern as the existing 14 (nullable, numeric where it's a measurement):

```sql
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS age integer CHECK (age IS NULL OR age > 0);
```

Reuses the existing `PUT /me/measurements` / `GET /me/measurements` endpoints — same partial-update behavior, no new endpoint needed. The body silhouette generator reads these three like it would read any other measurement.

**`fabrics` table — new**, a real catalog instead of free text:

```sql
CREATE TABLE IF NOT EXISTS fabrics (
  id serial PRIMARY KEY,
  name text NOT NULL,
  color_hex text NOT NULL CHECK (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  print_pattern text NOT NULL DEFAULT 'solid' CHECK (print_pattern IN ('solid', 'striped', 'checked')),
  texture text NOT NULL CHECK (texture IN ('cotton', 'linen', 'silk', 'wool', 'denim')),
  swatch_image_url text,
  price_modifier numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

`print_pattern` and `texture` are two different things the reference illustration called out and the original single `pattern` column conflated: `print_pattern` is what's printed on the cloth (solid/striped/checked); `texture` is the material's physical feel (cotton/linen/silk/wool/denim), which is what tells the frontend whether to draw crisp drape folds (cotton, linen) or a smoother, sheen-catching surface (silk) on the sketch. `color_hex` + both of these are what the frontend reads to pick the right fit-state SVG and fill it. `swatch_image_url` is only for a real photographed swatch thumbnail in the picker UI, not for the sketch. The `texture` list above is a starting proposal, not fixed — the frontend chat should confirm it covers every fabric the illustration style needs to distinguish. New endpoint: `GET /fabrics` → list of active fabrics, for the picker.

**`orders` table — add 2 columns:**

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_id integer REFERENCES fabrics(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS body_profile_snapshot jsonb;
```

`fabric_id` replaces free-text fabric choice for the catalog case (`fabric_note` stays, for any extra instructions alongside the catalog pick — "slightly looser than standard", etc). `body_profile_snapshot` snapshots height/weight/age at order submission, same pattern `measurements_snapshot` already uses — so the tailor's permanent record of what was ordered doesn't change if the customer updates their profile later.

`POST /orders` gains one new input: `fabricId` (validated against `fabrics.is_active`), and automatically snapshots `body_profile_snapshot` the same way it already snapshots measurements — no new input needed for that part.

## What stays 100% frontend, no backend involvement

The sketch itself — which fit-state SVG is shown, the cross-fade between states as a slider moves, fabric fill/texture rendering — is entirely a frontend asset and animation concern. The backend never generates, stores, or serves a sketch image; it only serves the data above (measurements including height/weight/age, garment type, fabric's `color_hex`/`print_pattern`/`texture`) that the frontend uses to pick and style the right pre-drawn state. No request hits the backend while a slider is being dragged — the backend only sees final values once, on submit.

## Next step

This schema goes through `/superpowers:brainstorming` for the actual design/mockup, then `/superpowers:test-driven-development` to build it — same process as the design-criteria handoff already sent. The `texture` value list is the one open item the frontend chat should confirm or correct.
