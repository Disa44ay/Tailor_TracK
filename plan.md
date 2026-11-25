# TailorTrack — plan (rewrite, 2026-11-24)

No file literally named `plan.md` existed before this; nothing is being
overwritten except whatever lived at this exact path previously (nothing
did — `git status` showed no such file). This document supersedes the
measurement/order-confirmation parts of
`docs/superpowers/handoffs/2026-11-21-frontend-build-plan-and-review.md`
("Measurement sliders wired to the sketch" and "Order submission") and the
admin-payment design in `docs/superpowers/specs/2026-11-21-order-customization-backend-design.md`.
Steps 1-4 of the original build plan (fabric picker, body profile fields,
garment selector, shirt sketch renderer) are already built and stay as-is;
this plan changes what comes after them.

## 0. What stays exactly the same

- **Theme and color tokens** — unchanged. Scribbled-notebook aesthetic,
  `ink`/`paper`/`accent`/`urgent`/`success`/`highlighter` tokens in
  `frontend/src/index.css`, Shantell Sans / Architects Daughter / Assistant
  type stack. Nothing in this rewrite touches color or theme.
- **The order production pipeline after confirmation** — confirmed → cutting
  → stitching → ready → completed stays as it is today (unaffected by this
  rewrite, which only touches *how an order gets to* "confirmed").
- **The admin reporting/order-board pages** — unaffected except for the
  quote/payment UI described in §5 below, which gets removed.

## 1. What we're borrowing from FIERO's flow (see `design planning/`)

FIERO's whole site funnels toward one low-friction primary action (Book
Appointment) followed by a human-reviewed step, with real customization
happening off-platform (in-person, with a tailor and a swatch book).
TailorTrack's version of that same shape:

- One clear primary action from the homepage ("Let's go") leads straight into
  the **live customization flow** (§2) instead of a calendar/time-slot picker
  — our live sketch *is* the "meet the tailor and discuss fabric" step,
  just interactive and immediate instead of scheduled.
- FIERO's human gatekeeping (a tailor ultimately has to agree feasibility,
  pricing, timeline) becomes the **admin accept/reject-with-note** step in
  §5 — same shape (a human reviews before committing to make anything), but
  the quote-and-advance-payment machinery FIERO doesn't have either (their
  own pricing is just a flat published price list, no live quoting) goes
  away too, per §5.
- We are **not** adopting FIERO's multi-page structure (separate Price Chart,
  Royalty Program, Career pages, etc.) — those aren't part of this app's
  scope. "Adopt the flow" here means the *shape* of the conversion funnel,
  not their page inventory.

## 2. The live customization flow (our signature feature)

One continuous screen (not a separate page per field) building up an order:

1. **Dress type** — `shirt | pant | panjabi | suit | paijama`. This is a
   narrower, flattened list than the existing order form's
   `GARMENT_TYPES` (which also has `suit_2pc`/`suit_3pc` split, `kurta`,
   `blouse`, `other`). **My call, flag for confirmation:** the live
   customization flow supports only these 5; the broader list stays
   available for a plain (non-customized) order request. `suit_2pc` vs
   `suit_3pc` collapses to one `suit` type for this flow — if the
   waistcoat/vest piece-count still matters, that becomes a style-note
   detail captured elsewhere, not a sketch variant for now.
2. **Fabric** — reuse the existing `FabricPicker` grid (already built).
   `texture` stays as fabric *metadata* only (shown as text on the swatch
   card, same as today) — **per your correction, the sketch itself does
   not render a texture-specific overlay for any fabric.** This removes the
   crisp-hatch-vs-sheen overlay layer from `ShirtSketch` (and any future
   garment sketch) entirely: a garment is rendered with the fabric's
   `color_hex` fill and `print_pattern` overlay (solid/striped/checked)
   only, nothing texture-driven. `muslin` can stay or not stay in the
   `texture` enum — it no longer affects rendering either way, so it's
   just a catalog-naming choice now, not a visual decision. Fabric color
   continues to come from the fabric's own `color_hex`, not a separate
   color picker — picking the fabric *is* picking the color.
3. **Fit type**, options depend on dress type (replaces the existing
   `FIT_TYPES_BY_GARMENT` lists with your simpler ones):

   | Dress type | Fit options |
   |---|---|
   | shirt | italian · casual · party |
   | suit | double breasted · italian · formal |
   | panjabi | regular · short |
   | paijama | short · casual |
   | pant | slim · regular · bootcut · baggy · relaxed · straightcut |

   **Ease allowance per fit type** (how much extra room each fit adds over
   the body's own measurement — this is what actually drives the sketch's
   width-scale and the slider defaults, same mechanism the old shirt spike
   used for slim/regular/relaxed). Researched against real men's tailoring
   and denim-fit references, since you asked for that rather than a guess:

   - **Pant** (sourced — Lee.com's denim fit glossary, a standard reference
     used industry-wide): *slim* = snug through the leg, narrow opening,
     a little more room than skinny; *regular* = normal range of movement,
     neither tight nor loose; *straightcut* = constant hem width hip-to-
     ankle, trim through the seat/thigh; *bootcut* = same as regular/
     straight through the thigh, with a moderate flare added only at the
     hem; *relaxed* = looser than regular, wider seat and thigh, longer
     rise; *baggy* = the most room — loose seat, leg, and leg opening.
     As a numeric starting point for the sketch's width-scale (inferred
     from that ordering, not a published inch chart): slim ≈ −10%,
     regular ≈ baseline, straightcut ≈ baseline (shape differs, not
     width), bootcut ≈ baseline + flare at hem only, relaxed ≈ +12%,
     baggy ≈ +22%.
   - **Suit** — **this one is a different kind of choice than the others:
     a structural cut, not just an ease amount, so the sketch needs genuinely
     different artwork per option, not one silhouette scaled wider/
     narrower.** Sourced from Gentleman's Gazette's British/Italian/American
     comparison, Hockerty's and Lordsuits' style guides, and Lanieri's piece
     on the modern Italian double-breasted cut:
     - **Double breasted**: two overlapping front panels with two columns
       of buttons (visually distinct — this is the one that needs its own
       sketch art, not a variant of the single-breasted one), almost always
       worn closed, so it's cut closer through the chest/waist than its
       formality would suggest (~2-3" chest ease, **inferred** — sources
       describe it as fitted-when-closed rather than giving an inch
       number), commonly a shorter jacket in the modern cut and a peak
       lapel. Best suited to a taller/leaner or broader-chested build per
       Hockerty's own guidance — worth surfacing that as a note in the UI,
       not silently applying it.
     - **Italian**: the slimmest of the three cuts (Gentleman's Gazette
       calls it "the opposite of the American sack," the slimmest-fitting
       style), a soft, natural, unpadded shoulder line, a shorter jacket
       length, closer chest/waist ease (~1-2", similar to a slim-fit
       shirt's ease). `shoulderWidth` should draw without the padded-
       shoulder bulk the formal cut has.
     - **Formal** (the English/classic cut): the more structured,
       straighter silhouette — padded/structured shoulder, more generous
       chest/waist ease than Italian (~3-5", **inferred** from "straighter
       and more structured" rather than a published number), standard or
       longer jacket length.

     **Build implication**: unlike pant/shirt (one base silhouette, scaled),
     the suit sketch needs at minimum a separate double-breasted front-panel
     asset in addition to the single-breasted one (shared by italian/
     formal, differing mainly in shoulder structure, ease, and length) —
     this is closer to "two garment variants" than "one garment, three
     widths," and should be scoped as such when it's built.
   - **Shirt** (sourced — tailorsizeguide.com's own measured chart, for a
     40" chest: slim finishes 42-43", regular 44-46", relaxed 46-48", i.e.
     roughly 2-3" / 4-6" / 6-8" ease). Your labels (italian/casual/party)
     **aren't standard tailoring terms** with their own published ease
     numbers — **my inferred mapping**: italian ≈ slim's ease (a close,
     Continental cut), casual ≈ regular's ease, party ≈ relaxed's ease
     (fuller, dressier). Flag if that mapping is wrong.
   - **Panjabi** (partially sourced — fashiondot.in's kurta cutting-
     measurement guide states a kurta/panjabi typically carries 6-8" of
     ease where a dress shirt carries about 4", and modern Bangladeshi
     panjabis trend toward a "semi-slim, contoured" cut rather than the
     older fully-loose style): *regular* = the standard full-length panjabi
     cut, ~6-8" body ease per that source; *short* = **not a different
     ease amount, a different garment length** — a kurta-length cut (hits
     around mid-thigh/hip, per the standard kurta-vs-panjabi length
     convention) instead of the longer traditional panjabi length, same
     ease allowance as regular. So `garmentLength` is the field this
     toggle actually drives, not chest/waist width.
   - **Paijama**: pajama trousers vary mainly by **length and drawstring
     looseness**, not chest/waist-style ease — *short* likely means
     ankle-length/cropped, *casual* the regular full-length loose cut.
     This one probably isn't a width-scale slider at all, just a length
     toggle; flag if that's wrong.

4. **Body stats** — height (cm), weight (kg), age. Already captured by the
   existing `Measurements` page's body-profile fields (step 2 of the old
   plan) — this flow reads them if already saved, or asks for them inline if
   not, writing to the same `heightCm`/`weightKg`/`age` fields either way (no
   new storage).
5. **Character/sketch generation** — the dress-type + fabric + fit selected
   above renders live, the same mechanism already built for `ShirtSketch`
   (pre-generated fit-state art, cross-faded, recolored via CSS mask +
   `mix-blend-mode: multiply`, texture/print overlay). Extending this to
   `pant`/`panjabi`/`suit`/`paijama` is new illustration + component work
   (same pattern as the shirt, one more `<Garment>Sketch` component and its
   fit-state art set per type) — this is the largest remaining chunk of
   build work in this plan.
6. **Auto-populated measurements** — see §3. Sliders appear **only for the
   fields that dress type actually uses** (e.g. a shirt never shows
   thigh/knee/rise; a pant never shows neck/bicep/collar-adjacent fields).
   The exact per-type field subset needs a real tailoring-knowledge pass
   (flagged in §3) rather than a guess.
7. **Save actions**, two distinct buttons:
   - **Save measurements** — writes the (possibly slider-adjusted) values to
     `measurements` via the existing `PUT /me/measurements`, same as today.
   - **Save design as PNG** — exports the current sketch (garment + fit +
     fabric as currently rendered) composited with a readout of the
     measurement values, as a downloadable image. Implementation: render the
     sketch's DOM/SVG to a canvas (e.g. via `html-to-image` or a canvas
     redraw of the same layers `ShirtSketch` already composites) and trigger
     a browser download — no backend involvement, purely client-side.
8. **Submit** — creates the order (`POST /orders`) carrying `garmentType`,
   `fitType`, `fabricId`, the measurement snapshot, and the body-profile
   snapshot, exactly as `POST /orders` already does today for `fabricId` and
   snapshots. No new backend endpoint needed for submission itself.

## 3. Auto-populated measurements from height/weight/age

**What this is, plainly stated so nothing gets lost in translation:** there
is no trustworthy live service that returns a real person's body
measurements from height/weight/age — that data doesn't exist to be
"fetched online" in any accurate, privacy-respecting way. What we're
actually building is a **seeded reference table of typical/average body
proportions** (standard tailoring ratio charts — the same kind of size
chart a ready-to-wear clothing brand publishes, e.g. "height 170-175cm +
weight 65-70kg → chest ≈ 96cm, waist ≈ 82cm..."), used only to pick a
*reasonable starting point* for the sliders, which the customer then
adjusts to their real body. This needs to be stated to the customer in the
UI too ("starting estimate — adjust to match you"), so nobody mistakes an
estimate for a measurement.

- **New table**: `measurement_estimates` (or similar) — rows keyed by
  height/weight/age bands (e.g. 5cm height bands × 5kg weight bands × a
  couple of age brackets), one column per measurement field, seeded once
  from a published tailoring size-chart source (needs an actual sourcing
  pass before the migration is written — not fabricated numbers).
- **Lookup**: given a customer's `heightCm`/`weightKg`/`age`, find the
  nearest band and return its row as the slider defaults. A small
  `GET /measurement-estimates?heightCm=&weightKg=&age=` endpoint, or folded
  into the existing `GET /me/measurements` response as a `suggested` block
  when the real stored value is null — **my call, flag for confirmation**:
  folding it into the existing endpoint is less plumbing than a new one.
- **Resolved**: this app is male tailoring only, per your note — the
  reference table is seeded from men's body-proportion data exclusively, no
  gender/sex field needed anywhere in the schema.

## 4. Per-garment-type measurement field subsets

Which of the 14 existing fields (`chest, waist, hip, shoulderWidth,
sleeveLength, inseam, neck, bicep, wrist, thigh, knee, rise, hem,
garmentLength`) actually apply per dress type — a first pass, **flagged as
needing a real tailoring-knowledge check, not guessed from vibes**:

| Field | shirt | pant | panjabi | suit | paijama |
|---|---|---|---|---|---|
| chest | yes | — | yes | yes | — |
| waist | yes | yes | yes | yes | yes |
| hip | — | yes | yes | yes | yes |
| shoulderWidth | yes | — | yes | yes | — |
| sleeveLength | yes | — | yes | yes | — |
| inseam | — | yes | — | yes | yes |
| neck | yes | — | yes | yes | — |
| bicep | yes | — | — | yes | — |
| wrist | yes | — | — | yes | — |
| thigh | — | yes | — | yes | yes |
| knee | — | yes | — | yes | yes |
| rise | — | yes | — | yes | yes |
| hem | yes | yes | yes | yes | yes |
| garmentLength | yes | — | yes | yes | yes |

Implementation: a `MEASUREMENT_FIELDS_BY_GARMENT` map (backend already has a
constant of this exact name per the codebase map — reuse/update it rather
than inventing a second one) drives both which sliders render and which
fields the backend expects/validates per `garmentType`.

## 5. Order confirmation — remove the payment gate

Current flow: `requested` → admin **quotes** (due date + price + required
advance) → customer **pays the advance via SSLCommerz** → `confirmed`.

New flow, per your instruction: `requested` → admin **accepts** (→
`confirmed` directly) **or rejects with a note** (→ `needs_changes`, already
built — `rejectOrder` already requires a reason today, keep it as-is) — no
price, no due date, no advance, no payment step, no SSLCommerz sandbox.

- **Backend**: replace `quoteOrder` (and its `dueDate`/`quotedPrice`/
  `advanceRequired` requirement) with a simple `acceptOrder` that transitions
  `requested` → `confirmed` directly, no body required. Leave
  `due_date`/`quoted_price`/`advance_required` columns in place (don't drop
  data), just stop requiring them to confirm.
- **SSLCommerz**: per your instruction, archive-not-delete. The service
  (`backend/services/sslcommerzService.js`), its controllers
  (`sslcommerzReturn`/`sslcommerzCallback` in `orders.controller.js`), and
  the route file itself (`backend/routes/payments.routes.js`) all stay
  exactly as they are, untouched. The single deactivation point is
  `backend/app.js:27` — comment out `app.use(paymentsRoutes);` (and its
  import on line 9, so nothing's left half-wired) with a one-line comment
  explaining why. That one line change makes every `/payments/sslcommerz/*`
  route unreachable while leaving all the actual payment code intact and
  easy to reactivate later (uncomment the same line).
- **Frontend**: the admin order-detail page's quote form (due date/price/
  advance inputs) gets replaced with two buttons — Accept / Reject (reject
  already prompts for a note today; keep that UI, just repoint Accept).
  The customer-facing "pay the advance" step disappears entirely from the
  order-detail page.

## 6. UI component stack for this rebuild

As discussed:
- **SketchUI** (sketchui.sanjoydev.com) — static hand-drawn components
  (Card, Badge, Paper, NotebookBackground, SectionTitle, Separator, etc).
  Copy-paste source, not an npm dependency — pull in only the specific
  components we actually use, and read each one's source before adopting it,
  same discipline as any copied code.
- **`rough-notation`** — live hand-drawn annotations/marks that animate in
  on a state change (e.g. circling the selected fit option, a hand-drawn
  strikethrough when an order is marked complete, an underline sliding onto
  the active nav item).
- **`framer-motion`** (published as `motion`) — general transitions/
  orchestration (the sketch cross-fade already works without it, but card
  re-sorting on the admin order board, panel enter/exit, and triggering
  `rough-notation` on the right moment all want this).

None of these touch color/theme tokens — they consume the existing
`index.css` tokens, not their own palettes.

## 7. Build order

Picking up where the original build plan left off (steps 1-4 done):

1. Confirm the two still-open items: the panjabi "cuban" fit label (shirt-
   collar term, not a usual panjabi fit — needs a second look) and whether
   paijama's "short/casual" is a length toggle rather than a width-ease
   slider.
2. Backend: `measurement_estimates` table (male-only data) + lookup,
   updated `MEASUREMENT_FIELDS_BY_GARMENT`, updated fit-type lists +
   per-fit ease values (§2), `acceptOrder` replacing `quoteOrder`, comment
   out `app.use(paymentsRoutes)` in `app.js`.
3. Frontend: assemble the live-customization screen (dress type → fabric →
   fit → body stats → sketch → sliders → save/submit), reusing
   `FabricPicker` and the body-profile fields already built.
4. Build the `pant`/`panjabi`/`suit`/`paijama` sketch components (new
   illustration generation + component per type, same pattern as
   `ShirtSketch`) — largest remaining chunk, one type at a time, each
   through the project's normal brainstorm → hallmark → TDD → review cycle.
5. "Save as PNG" export.
6. Admin accept/reject UI update; remove the quote/advance-payment UI.
7. Swap in SketchUI/rough-notation/framer-motion pieces as the relevant
   screens get built, not as a separate big-bang redesign pass.
