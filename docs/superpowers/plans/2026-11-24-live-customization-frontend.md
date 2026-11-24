# Live Customization Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend half of the live-customization order flow: a
dress-type/fabric/fit-aware live garment sketch, auto-populated and
per-garment-filtered measurement sliders, save-measurements/save-as-PNG
actions, and the simplified admin accept/reject UI — matching the already-
approved plan at `plan.md` (repo root).

**Architecture:** Extends the existing `FabricPicker` + body-profile-fields
work already in the codebase. Adds a `GarmentSketch` dispatcher over one
sketch component per dress type (`ShirtSketch` already exists; `PantSketch`,
`PanjabiSketch`, `SuitSketch`, `PaijamaSketch` are new), each following
`ShirtSketch`'s established pattern (precomputed fit-state art, CSS
mask-based recoloring, no texture overlay per plan.md's correction). A new
`DressTypePicker` and `FitTypePicker` drive which sketch renders and which
measurement sliders show, via a new `MEASUREMENT_FIELDS_BY_GARMENT` and
`FIT_OPTIONS_BY_GARMENT` frontend constant mirroring the backend's.

**Tech Stack:** React 18 + Vite, Tailwind v4, Vitest + Testing Library
(existing stack — no new frontend dependencies for this plan beyond what
§6 of `plan.md` names, which are adopted incrementally per component, not
all at once).

**Spec:** `plan.md` (repo root) — read it in full before starting; this plan
implements §2-§7 of it (frontend side only; §3's backend estimate lookup is
a separate session's work, consumed here as a prop/API response).

## Global Constraints

- Theme/color tokens are unchanged — no new colors, no new fonts.
- No texture-driven rendering on any sketch (plan.md's correction) — only
  `color_hex` fill + `print_pattern` overlay, same as `ShirtSketch` after
  its review fixes.
- Male-only measurement estimates — no gender field anywhere.
- SSLCommerz / payment UI is being removed from the admin flow in this plan
  (Task 8) — this frontend change does not depend on the backend's route
  deactivation landing first (they're independent files).
- Every new component: TDD (test written and confirmed red before the
  implementation), then hallmark's floor checklist (tokens-only colors, no
  `transition: all`, `prefers-reduced-motion` fallback on any animation,
  `focus-visible` on every interactive element), then a `sloplint` pass
  where the component touches new markup.
- A garment sketch's illustrated art (the fit-state images) is an
  exploratory, iterative deliverable, not a fully pre-specifiable one —
  each sketch task includes a brainstorm-and-generate step mirroring how
  `ShirtSketch`'s art was actually produced (spike, show the user a
  screenshot, iterate on explicit feedback, lock in), not a fixed asset
  list.

## Review Focus

- **A garment type with no real fit-state assets yet** (e.g. `PantSketch`
  rendered before its art generation finishes) should show a clear
  placeholder, not a broken image or a crash — a customer mid-flow must
  never see a blank box with no explanation.
- **Switching dress type after already picking a fit type** that doesn't
  exist for the new dress type (e.g. picked "party" for shirt, switches to
  suit) must reset the fit-type selection rather than silently submit an
  invalid combination.
- **A measurement field hidden for the current dress type** (e.g. `thigh`
  for a shirt order) must not appear in the `PUT /me/measurements` or
  `POST /orders` body at all for that submission — not sent as `null`,
  not sent as a stale leftover value from a previous dress-type selection
  in the same session.
- **The backend's estimate endpoint being unavailable or still unbuilt**
  (this frontend work may ship before the backend session's part lands)
  must degrade to empty/manual sliders, not crash the screen — the existing
  `Measurements` page's `catch(() => {})` pattern is the precedent to
  follow.
- **"Save design as PNG" clicked before any fabric/fit is selected** (just
  the default placeholder sketch) should still export something coherent,
  not throw — the export path cannot assume every selection has been made.

---

## Task 1: Fit-type and measurement-field-by-garment constants (frontend)

**Files:**
- Create: `frontend/src/components/order/fitOptionsByGarment.js`
- Create: `frontend/src/components/order/measurementFieldsByGarment.js`
- Test: `frontend/src/components/order/fitOptionsByGarment.test.js`
- Test: `frontend/src/components/order/measurementFieldsByGarment.test.js`

**Interfaces:**
- Produces: `FIT_OPTIONS_BY_GARMENT` — `{ shirt: string[], pant: string[],
  panjabi: string[], suit: string[], paijama: string[] }`, exact values
  from `plan.md` §2 (shirt: italian/casual/party; pant: slim/regular/
  bootcut/baggy/relaxed/straightcut; panjabi: regular/short; suit: double
  breasted/italian/formal — store as `"double_breasted"` to match the
  snake_case wire convention used elsewhere; paijama: short/casual).
- Produces: `MEASUREMENT_FIELDS_BY_GARMENT` — `{ [garmentType]: string[]
  }`, one entry per dress type, values from `plan.md` §4's table (the 14
  existing field keys, camelCase, matching `Measurements.jsx`'s `FIELDS`
  keys).

- [ ] **Step 1: Write the failing tests**

```js
// fitOptionsByGarment.test.js
test("has exactly the five dress types from plan.md", () => {
  expect(Object.keys(FIT_OPTIONS_BY_GARMENT).sort()).toEqual(
    ["panjabi", "paijama", "pant", "shirt", "suit"]
  );
});
test("suit options match plan.md §2", () => {
  expect(FIT_OPTIONS_BY_GARMENT.suit).toEqual(["double_breasted", "italian", "formal"]);
});
test("pant has all six researched options", () => {
  expect(FIT_OPTIONS_BY_GARMENT.pant).toEqual(
    ["slim", "regular", "bootcut", "baggy", "relaxed", "straightcut"]
  );
});
```

```js
// measurementFieldsByGarment.test.js
test("shirt excludes lower-body fields", () => {
  expect(MEASUREMENT_FIELDS_BY_GARMENT.shirt).not.toContain("thigh");
  expect(MEASUREMENT_FIELDS_BY_GARMENT.shirt).not.toContain("knee");
  expect(MEASUREMENT_FIELDS_BY_GARMENT.shirt).toContain("chest");
});
test("pant excludes upper-body-only fields", () => {
  expect(MEASUREMENT_FIELDS_BY_GARMENT.pant).not.toContain("neck");
  expect(MEASUREMENT_FIELDS_BY_GARMENT.pant).not.toContain("chest");
  expect(MEASUREMENT_FIELDS_BY_GARMENT.pant).toContain("thigh");
});
test("every dress type's fields are a subset of the 14 known measurement keys", () => {
  const known = ["chest","waist","hip","shoulderWidth","sleeveLength","inseam","neck","bicep","wrist","thigh","knee","rise","hem","garmentLength"];
  for (const fields of Object.values(MEASUREMENT_FIELDS_BY_GARMENT)) {
    for (const f of fields) expect(known).toContain(f);
  }
});
```

- [ ] **Step 2: Run tests, confirm they fail** (module doesn't exist)

- [ ] **Step 3: Implement both constants** per plan.md §2 and §4's tables
  exactly — a flat object literal each, no logic.

- [ ] **Step 4: Run tests, confirm green**

- [ ] **Step 5: Commit**

---

## Task 2: `DressTypePicker` component

**Files:**
- Create: `frontend/src/components/order/DressTypePicker.jsx`
- Test: `frontend/src/components/order/DressTypePicker.test.jsx`

**Interfaces:**
- Consumes: nothing external (the 5 dress types are a fixed list local to
  this component: `shirt`, `pant`, `panjabi`, `suit`, `paijama`).
- Produces: props `{ selected: string | null, onSelect: (dressType: string) => void }`.
  Renders one button per dress type; the selected one gets `aria-pressed="true"`.

- [ ] **Step 1: Brainstorm the look** — a row or small grid of 5 labeled
  buttons (no icons required; reuse the project's existing button patterns
  from `FabricPicker`'s card style, scaled down since there's no swatch
  image here, just a label). Show a quick mockup/screenshot to the user for
  approval before writing code — this is a small, self-contained component,
  so a short blueprint in chat is enough, no full design doc needed.
- [ ] **Step 2: Write the failing tests** — renders 5 buttons with the
  correct labels; clicking one calls `onSelect` with that dress type;
  `aria-pressed` reflects `selected`.
- [ ] **Step 3: Run tests, confirm red**
- [ ] **Step 4: Implement**, following `FabricPicker`'s button/selection
  pattern (plain `<button aria-pressed>`, no custom keyboard handling
  needed since buttons are natively keyboard-operable).
- [ ] **Step 5: Run tests, confirm green**
- [ ] **Step 6: Hallmark** — run `sloplint` on the new file; fix every FAIL,
  fix or waive every REFLEX with a recorded reason (same pattern as
  `FabricPicker`'s waived 26b).
- [ ] **Step 7: Commit**

---

## Task 3: `FitTypePicker` component

**Files:**
- Create: `frontend/src/components/order/FitTypePicker.jsx`
- Test: `frontend/src/components/order/FitTypePicker.test.jsx`

**Interfaces:**
- Consumes: `FIT_OPTIONS_BY_GARMENT` (Task 1).
- Produces: props `{ dressType: string, selected: string | null, onSelect: (fit: string) => void }`.
  Renders the options for the given `dressType` only (reads
  `FIT_OPTIONS_BY_GARMENT[dressType]`).

- [ ] **Step 1: Write the failing tests** — given `dressType="suit"`,
  renders exactly `double_breasted`/`italian`/`formal` (as human-readable
  labels, e.g. "Double breasted"); given `dressType="pant"`, renders all
  six pant options and none of suit's; clicking an option calls `onSelect`.
- [ ] **Step 2: Run tests, confirm red**
- [ ] **Step 3: Implement** — same button pattern as `DressTypePicker`.
  Label formatting: `fit.replace(/_/g, " ")` then capitalize first letter,
  matching the existing `garmentType.replace(/_/g, " ")` convention already
  used in `NewOrder.jsx`/`AdminOrderDetail.jsx`.
- [ ] **Step 4: Run tests, confirm green**
- [ ] **Step 5: Write the failing test for the reset behavior** (Review
  Focus item 2): a test rendering `FitTypePicker` wrapped by a small test
  harness that changes `dressType` after a selection, asserting the
  *consumer* is responsible for clearing `selected` — document in this
  component's own test that `FitTypePicker` is presentational only (it
  doesn't own `selected` state), and add the actual reset-on-dress-type-
  change assertion to Task 7's screen-level test instead, where the state
  actually lives. Note this explicitly in a comment so the behavior isn't
  silently dropped.
- [ ] **Step 6: Hallmark** — sloplint pass.
- [ ] **Step 7: Commit**

---

## Task 4: `GarmentSketch` dispatcher + sketch component interface contract

**Files:**
- Create: `frontend/src/components/order/sketch/GarmentSketch.jsx`
- Test: `frontend/src/components/order/sketch/GarmentSketch.test.jsx`

**Interfaces:**
- Consumes: `ShirtSketch` (existing), and placeholder stand-ins for
  `PantSketch`/`PanjabiSketch`/`SuitSketch`/`PaijamaSketch` until Tasks
  5-8 land (see Step 3).
- Produces: a single component, props `{ dressType, fitValue, fitType,
  colorHex, printPattern }`, that renders the matching `<Xxx Sketch>` for
  `dressType`. This is the only sketch import the rest of the app needs —
  Task 9's screen imports `GarmentSketch`, never an individual garment
  component directly, so Tasks 5-8 can land later without touching the
  screen again.

- [ ] **Step 1: Write the failing tests** — `dressType="shirt"` renders
  `ShirtSketch` with its props forwarded; an unimplemented `dressType`
  (e.g. `"pant"` before Task 5 lands) renders a labeled placeholder
  (`"Pant sketch coming soon"` or similar — exact copy is this task's own
  call) instead of crashing (Review Focus item 1).
- [ ] **Step 2: Run tests, confirm red**
- [ ] **Step 3: Implement** — a lookup object `{ shirt: ShirtSketch, pant:
  null, panjabi: null, suit: null, paijama: null }`; render the component
  if present, else the placeholder. Updating this file to point `pant` at
  the real `PantSketch` is literally the only frontend change Task 5 makes
  to any file outside its own new ones.
- [ ] **Step 4: Run tests, confirm green**
- [ ] **Step 5: Commit**

---

## Task 5: `PantSketch` component

**Files:**
- Create: `frontend/src/components/order/sketch/PantSketch.jsx`
- Create: `frontend/src/components/order/sketch/assets/pant-*.webp` (fit-state art, exact filenames TBD by what gets generated)
- Test: `frontend/src/components/order/sketch/PantSketch.test.jsx`
- Modify: `frontend/src/components/order/sketch/GarmentSketch.jsx` (point `pant` at this component)

**Interfaces:**
- Consumes: same props shape as `ShirtSketch` — `{ fitValue, colorHex,
  printPattern }` (no `texture` prop — plan.md's correction removes texture
  rendering for every garment, not just new ones) — plus `fitType: string`
  (one of pant's 6 options), since pant's sketch differs by fit *and* a
  slider isn't enough to capture bootcut's hem-only flare or straightcut's
  shape difference (plan.md §2) — read `fitType` to pick which fit-state
  pair to cross-fade between, not just where `fitValue` sits on one curve.
- Produces: same exported shape as `ShirtSketch` — default export
  component, named export `crossfadeOpacities`-equivalent reused from
  `ShirtSketch.jsx` (import and reuse the existing function — it's already
  generic over an arbitrary state list, per its own tests — rather than
  duplicating it).

- [ ] **Step 1: Brainstorm + generate the art** — same process actually
  used for `ShirtSketch`: generate candidate fit-state illustrations (at
  minimum slim and relaxed as the two ends of a width-scale, since
  straightcut/bootcut/baggy are shape or hem-only differences layered on
  top per plan.md §2, not just more width-scale points — resolve exactly
  how many distinct art states this needs as part of this brainstorm, not
  guessed here), show the user a screenshot, get explicit approval before
  treating any asset as final.
- [ ] **Step 2: Write the failing tests** — mirrors `ShirtSketch.test.jsx`:
  renders a layer per visible fit state tinted with `colorHex`; hides a
  layer at opacity 0; masks tint/print layers to the correct asset URL;
  degrades gracefully for an unrecognized `fitType` or `printPattern`;
  accessible label naming the fabric. Add one pant-specific test: switching
  `fitType` between two options that map to different art pairs (e.g.
  `"slim"` vs `"baggy"`) changes which asset URLs appear.
- [ ] **Step 3: Run tests, confirm red**
- [ ] **Step 4: Implement**, reusing `ShirtSketch`'s CSS-mask + `mix-blend-
  mode: multiply` tinting technique exactly (including its `supportsCssMask`
  fallback guard from the review fix) — no texture overlay layer at all
  (plan.md's correction), so this is actually simpler than `ShirtSketch`'s
  first version, not more complex.
- [ ] **Step 5: Run tests, confirm green**
- [ ] **Step 6: Hallmark** — sloplint pass; recompress art the same way
  `ShirtSketch`'s review fix did (WebP, target a few hundred KB per asset,
  not multi-MB PNGs).
- [ ] **Step 7: Verify live** — temporary dev-preview route (same pattern
  used for `ShirtSketch`), screenshot each fit option, confirm with the
  user, then remove the temp route before committing.
- [ ] **Step 8: Request code review** (same subagent-review pattern used
  for `FabricPicker`/`ShirtSketch`); apply fixes.
- [ ] **Step 9: Point `GarmentSketch.jsx`'s `pant` entry at this component**
- [ ] **Step 10: Commit**

---

## Task 6: `PanjabiSketch` component

**Files:**
- Create: `frontend/src/components/order/sketch/PanjabiSketch.jsx`
- Create: `frontend/src/components/order/sketch/assets/panjabi-*.webp`
- Test: `frontend/src/components/order/sketch/PanjabiSketch.test.jsx`
- Modify: `frontend/src/components/order/sketch/GarmentSketch.jsx`

**Interfaces:** same shape as Task 5's `PantSketch`, with one difference:
panjabi's `fitType` (`regular`/`short`) is a **length** difference
(`garmentLength`), not a width-ease difference per plan.md §2 — so this
component's two fit states differ in art proportions (shorter hem) rather
than width-scale, and it likely does **not** need the `fitValue`
cross-fade slider at all, just a binary choice between two pre-drawn
lengths with a cross-fade for the visual transition. Confirm this
simplification during Step 1's brainstorm rather than assuming it.

- [ ] **Step 1: Brainstorm + generate the art** (regular-length and
  short/kurta-length variants), confirm with the user.
- [ ] **Step 2: Write the failing tests** (mirroring Task 5, adjusted for
  the length-not-width distinction confirmed in Step 1).
- [ ] **Step 3: Run tests, confirm red**
- [ ] **Step 4: Implement**
- [ ] **Step 5: Run tests, confirm green**
- [ ] **Step 6: Hallmark + asset compression**
- [ ] **Step 7: Verify live, get user confirmation**
- [ ] **Step 8: Code review + fixes**
- [ ] **Step 9: Point `GarmentSketch.jsx`'s `panjabi` entry at this component**
- [ ] **Step 10: Commit**

---

## Task 7: `SuitSketch` component (two structural variants)

**Files:**
- Create: `frontend/src/components/order/sketch/SuitSketch.jsx`
- Create: `frontend/src/components/order/sketch/assets/suit-*.webp` (at
  minimum: a single-breasted base art set for italian/formal, plus a
  separate double-breasted front-panel art set — see plan.md §2's "Build
  implication" note)
- Test: `frontend/src/components/order/sketch/SuitSketch.test.jsx`
- Modify: `frontend/src/components/order/sketch/GarmentSketch.jsx`

**Interfaces:** same base shape as Tasks 5-6, `fitType` one of
`double_breasted`/`italian`/`formal`. Unlike pant/panjabi, this is **not** a
single cross-fade axis at all: `double_breasted` swaps to a structurally
different asset (different front-panel art), while `italian`/`formal`
differ by shoulder structure and ease/length on what can be a shared base
silhouette (plan.md §2). Resolve the exact state-machine (how many
distinct art pieces, which ones cross-fade vs. hard-swap) during Step 1 —
this is the largest single art-generation task in the plan and should not
be scoped tighter than that here.

- [ ] **Step 1: Brainstorm + generate the art** — at minimum: italian and
  formal as a cross-fadable pair (shared silhouette, shoulder/ease/length
  differences), plus a separate double-breasted asset (hard-swap, not
  cross-faded with the other two, since it's a different garment
  structure). Show the user all three rendered states before writing any
  component code.
- [ ] **Step 2: Write the failing tests** — the double-breasted case
  specifically needs a test asserting it renders the distinct
  double-breasted asset, not a cross-fade blend with italian/formal.
- [ ] **Step 3: Run tests, confirm red**
- [ ] **Step 4: Implement**
- [ ] **Step 5: Run tests, confirm green**
- [ ] **Step 6: Hallmark + asset compression**
- [ ] **Step 7: Verify live, get user confirmation** (all three fit types,
  explicitly including the double-breasted silhouette looking visually
  distinct, not a scaled version of the others)
- [ ] **Step 8: Code review + fixes**
- [ ] **Step 9: Point `GarmentSketch.jsx`'s `suit` entry at this component**
- [ ] **Step 10: Commit**

---

## Task 8: `PaijamaSketch` component

**Files:**
- Create: `frontend/src/components/order/sketch/PaijamaSketch.jsx`
- Create: `frontend/src/components/order/sketch/assets/paijama-*.webp`
- Test: `frontend/src/components/order/sketch/PaijamaSketch.test.jsx`
- Modify: `frontend/src/components/order/sketch/GarmentSketch.jsx`

**Interfaces:** same shape as Task 6 (`short`/`casual` is a length/
looseness difference per plan.md §2, not a width-ease slider) — follow
Task 6's resolved pattern directly since the two are structurally the same
kind of simplification.

- [ ] **Step 1: Brainstorm + generate the art, confirm with the user**
- [ ] **Step 2: Write the failing tests**
- [ ] **Step 3: Run tests, confirm red**
- [ ] **Step 4: Implement**
- [ ] **Step 5: Run tests, confirm green**
- [ ] **Step 6: Hallmark + asset compression**
- [ ] **Step 7: Verify live, get user confirmation**
- [ ] **Step 8: Code review + fixes**
- [ ] **Step 9: Point `GarmentSketch.jsx`'s `paijama` entry at this component**
- [ ] **Step 10: Commit**

---

## Task 9: Measurement slider panel (per-garment filtered, estimate-aware)

**Files:**
- Create: `frontend/src/components/order/MeasurementSliderPanel.jsx`
- Test: `frontend/src/components/order/MeasurementSliderPanel.test.jsx`

**Interfaces:**
- Consumes: `MEASUREMENT_FIELDS_BY_GARMENT` (Task 1).
- Produces: props `{ dressType: string, values: Record<string, number|"">,
  estimated: Record<string, number> | null, onChange: (field: string, value: number) => void }`.
  Renders one labeled slider/number input per field in
  `MEASUREMENT_FIELDS_BY_GARMENT[dressType]` only. When `values[field]` is
  empty and `estimated` has that field, the slider initializes at the
  estimated value and shows a small "estimated — adjust to match you" label
  (plan.md §3's disclosure requirement) until the user actually moves it.

- [ ] **Step 1: Write the failing tests** — renders only the fields for the
  given `dressType` (reuse the Task 1 test fixtures: shirt excludes thigh/
  knee, pant excludes neck/chest); a field with no stored value falls back
  to its estimate and shows the "estimated" label; moving a slider calls
  `onChange` and clears the "estimated" label for that field;
  `estimated: null` (Review Focus item 4 — backend not available yet)
  renders plain empty sliders with no crash.
- [ ] **Step 2: Run tests, confirm red**
- [ ] **Step 3: Implement**, following `Measurements.jsx`'s existing
  `<input type="number">` + label pattern for consistency (this plan
  doesn't introduce a new slider widget from SketchUI yet — that's an
  incremental swap per plan.md §6, not a blocking dependency for this
  task).
- [ ] **Step 4: Run tests, confirm green**
- [ ] **Step 5: Hallmark — sloplint pass**
- [ ] **Step 6: Commit**

---

## Task 10: "Save design as PNG" export

**Files:**
- Create: `frontend/src/components/order/sketch/exportSketchPng.js`
- Test: `frontend/src/components/order/sketch/exportSketchPng.test.js`
- Modify: `frontend/package.json` (add an image-export dependency — decide
  the exact package during this task; `html-to-image` is the obvious small,
  actively-maintained candidate, confirm it's still current before adding)

**Interfaces:**
- Produces: `exportSketchPng(sketchElement: HTMLElement, measurements: Record<string, number>): Promise<void>`
  — composites the rendered sketch with a text readout of the given
  measurements onto one canvas, then triggers a browser download. Pure
  client-side, no backend call.

- [ ] **Step 1: Write the failing test** — given a DOM node and a
  measurements object (including the edge case from Review Focus item 5:
  an empty/default measurements object with no selections made yet), calling
  `exportSketchPng` resolves without throwing and triggers a download (mock
  the actual image-library call; assert it was invoked with the right
  arguments, don't test real canvas rendering in jsdom).
- [ ] **Step 2: Run test, confirm red**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run test, confirm green**
- [ ] **Step 5: Verify live** — actually click the export button in the
  browser preview and open the downloaded file, confirm it looks right
  (this is exactly the kind of claim that needs real verification, not an
  assumption from the mocked unit test).
- [ ] **Step 6: Commit**

---

## Task 11: Assemble the live-customization screen

**Files:**
- Modify: `frontend/src/pages/NewOrder.jsx` (replace the current fabric-
  picker-bolted-onto-the-old-form section with the full flow: dress type →
  fabric → fit type → body stats → sketch → measurement sliders → save
  buttons → existing submit form)
- Test: `frontend/src/pages/NewOrder.test.jsx` (extend the existing file)

**Interfaces:**
- Consumes: `DressTypePicker` (Task 2), `FitTypePicker` (Task 3),
  `GarmentSketch` (Task 4), `MeasurementSliderPanel` (Task 9),
  `exportSketchPng` (Task 10), `FabricPicker`/`fabricsMock` (existing).

- [ ] **Step 1: Write the failing tests** — selecting a dress type narrows
  the fit options shown (Task 3's consumer-owns-reset behavior, actually
  exercised here per Task 3 Step 5's note); switching dress type after a
  fit was already picked clears the fit selection (Review Focus item 2,
  owned by this task); the measurement fields shown change with dress type;
  submitting includes only the fields `MEASUREMENT_FIELDS_BY_GARMENT` names
  for the selected dress type, nothing else (Review Focus item 3);
  "Save measurements" calls `PUT /me/measurements` with just those fields;
  "Save design as PNG" calls `exportSketchPng`.
- [ ] **Step 2: Run tests, confirm red**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run tests, confirm green**
- [ ] **Step 5: Run the full frontend suite**, confirm nothing else broke
- [ ] **Step 6: Verify live** — full click-through in the browser preview,
  same rigor as the earlier fabric-picker/shirt-sketch verification this
  session already did (sign in, reach the page, exercise every control).
- [ ] **Step 7: Request code review + apply fixes**
- [ ] **Step 8: Commit**

---

## Task 12: Admin accept/reject UI (depends on backend's `acceptOrder`)

**Files:**
- Modify: `frontend/src/pages/AdminOrderDetail.jsx:191-241` (replace the
  "Quote" form with a single "Accept" button; remove the dead `"quoted"`
  status branch at lines 245-247 since that status is no longer reachable)

**Interfaces:**
- Consumes: `PATCH /admin/orders/:id/accept` (backend session's Task 4) —
  **this task is blocked until that endpoint exists**; confirm it's live
  (check the backend session's report, or `grep` the route file) before
  starting.

- [ ] **Step 1: Confirm the backend endpoint exists** (`grep -n "accept"
  backend/routes/orders.routes.js`) — if not yet landed, hold this task and
  continue with Tasks 5-11 in the meantime.
- [ ] **Step 2: Write the failing test** — clicking "Accept" calls `PATCH
  /admin/orders/:id/accept` with no body, then reloads the order; the
  "Reject" form is unchanged (still requires a reason).
- [ ] **Step 3: Run test, confirm red**
- [ ] **Step 4: Implement** — delete `handleQuote` and its three form
  fields' state, replace the Quote `<form>` with a plain `<button
  onClick={handleAccept}>`, delete the dead `order.status === "quoted"`
  branch.
- [ ] **Step 5: Run test, confirm green**
- [ ] **Step 6: Run the full frontend suite**
- [ ] **Step 7: Verify live** (as the seeded admin account from earlier in
  this session — `admin@tailortrack.local`)
- [ ] **Step 8: Commit**

---

## Self-review notes

- **Spec coverage**: plan.md §2 (flow) → Tasks 2-3, 9, 11. §2's per-garment
  fit/measurement tables → Task 1. §2's sketch generation → Tasks 4-8. §2's
  save actions → Tasks 9-11. §5's admin simplification → Task 12. §6's UI
  library adoption is explicitly *not* a task here — plan.md itself says
  "as the relevant screens get built, not a separate big-bang pass," so
  SketchUI/rough-notation/framer-motion adoption is deferred to whichever
  future task touches each specific screen, not forced into this plan.
- **Order chosen deliberately**: constants and pickers (1-3) before the
  dispatcher (4) before any individual sketch (5-8), so each sketch task is
  a clean, independently-reviewable addition that only ever touches its own
  new files plus one line of `GarmentSketch.jsx`. The screen assembly (11)
  comes last, after every piece it composes already exists and is tested
  alone.
- **Task 12 is explicitly allowed to block** on the other session's work
  without blocking this plan's other 11 tasks — called out in its own first
  step rather than left implicit.
