# Handoff: build plan for the live-customization order flow + report-back template

For: the frontend chat. Read `CLAUDE.md`, the design-criteria handoff, and the schema handoff
(`2026-11-21-order-customization-schema.md`) first — this doc assumes both are already read.

## Build plan — one piece at a time, in this order

Don't build everything before showing anything (same rule as the design-criteria handoff). Each
step: `/superpowers:brainstorming` → blueprint → wait for approval → `/hallmark` on the approved
design → `/superpowers:test-driven-development` → `/ponytail:ponytail`. Don't start the next step
until the current one is approved and tested.

1. **Fabric picker.** Backend's `GET /fabrics` endpoint doesn't exist yet (see "What backend will
   build" below). Don't block on it — build against a local mock matching its locked shape:
   `{ id, name, colorHex, printPattern, texture, swatchImageUrl, priceModifier }`. Swap the mock for
   the real endpoint once backend confirms it's live.
2. **Body profile fields.** Add height/weight/age to the existing measurements form/page — same
   pattern as the other 14 fields, not a new page. Same mock-then-swap approach if backend's
   migration isn't live yet.
3. **Garment type selector.** Already exists — reuse it, don't rebuild it.
4. **Sketch renderer, one garment type only (pick the simplest — shirt).** Get the fit-state SVGs
   (slim/regular/relaxed, or however many states the illustration work settles on) and the
   cross-fade mechanic working for this one garment before touching the other four.
5. **Measurement sliders wired to the sketch.** Map each slider's value range to a fit state and
   drive the cross-fade percentage.
6. **Fabric applied to the sketch.** `colorHex` fill plus a `texture`-driven overlay (crisp folds
   for cotton/linen, smoother sheen for silk, etc).
7. **Remaining garment types**, repeating steps 4-6 per type.
8. **Order submission.** Wire `POST /orders` with `fabricId` once both sides of that endpoint are
   live.

## Report back to this chat after each step

Backend can't tell what to build next without knowing what the frontend actually ended up calling.
After each step above lands, send back:

- **What was built** — one line, which step/component.
- **What it calls or will call** — exact method, path, request body, and expected response shape,
  as actually used in the code (not "whatever the schema doc said" — if it drifted, say how).
- **Anything new the schema doc didn't cover** — a field, an endpoint, a shape that came up while
  building that wasn't anticipated.
- **Mock or real** — is this step currently running against the local mock or the live backend.

This is what lets backend review and close any gap before the frontend needs the real thing.

## What backend will build to match (ready now, schema is locked)

These don't depend on any frontend rendering decision, so backend can build them independently,
in parallel with steps 1-3 above:

- Migrate `schema.sql`: the 3 `measurements` columns, the `fabrics` table, the 2 `orders` columns.
- `GET /fabrics` (list active fabrics) + a seed script for a handful of fabrics to develop against.
- Extend `PUT /me/measurements` / `GET /me/measurements` for height/weight/age.
- Extend `POST /orders` for `fabricId` + automatic `body_profile_snapshot`.

Not started yet — this doc is the plan, not a build log. Say if you want this chat to start on
these now; they're independent of whatever the frontend chat decides about fit-state assets.
