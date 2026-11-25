# অবয়ব (Oboyob) — Bespoke Tailoring Site Redesign

**Supersedes**: the previous `plan.md`'s whole product direction (the live
garment-customization order flow — sketches, fit sliders, per-garment
measurement fields). That work is preserved as history on `dev`/`main`;
this document starts a fresh direction on branch `Dev_exp`, built from a
stripped-down skeleton (auth + routing + DB connection + tooling only —
see §4).

**Why**: the live-customization flow was too complex for this project's
scope and timeline. The new direction trades a self-service configurator
for an editorial, appointment-led flow — closer to how real bespoke
tailoring houses actually take orders — with distinct Bengali branding.

## 0. Brand

- **Name**: অবয়ব (Oboyob — roughly "form" / "figure" / "silhouette" in
  Bengali, a fitting name for a tailoring studio).
- **Tagline direction**: "OBOYOB — CUSTOM CLOTHING STUDIO" (English
  subhead under the Bengali wordmark, English wording open to revision).
- **Logo**: a Bengali *wordmark*, not an icon next to a name. Three
  treatments were prototyped as real text in the actual webfonts (not an
  AI-generated image — Bengali script is too easy for an image model to
  garble) and reviewed side by side:
  1. Editorial — elegant Bengali lettering, generous spacing.
  2. **Experimental — CHOSEN.** The word split into three segments at
     different weights and baselines in Anek Bangla (অ heavy/large, বয়
     light and dropped, ব heavy/raised), on the ink-dark ground, brick-red
     accent on the lighter middle segment, with the "CUSTOM CLOTHING
     STUDIO" line centered beneath in Hind Siliguri, tracked uppercase.
  3. Minimal — simple black wordmark, one distinctive modified character.
  - This fixes the *idea* (segmented weight/baseline treatment); the exact
    pixel values (font sizes, offsets, tracking) get refined again once
    it's built as a real, reusable mark (an SVG or a small component) for
    the nav, footer and favicon — not copy-pasted from the exploration
    mockup's inline styles.
- **Typography**:
  | Role | Typeface |
  |---|---|
  | Logo | Custom-drawn Bengali lettering, inspired by Tiro Bangla |
  | Headlines | Tiro Bangla |
  | Body / interface | Hind Siliguri |
  | Experimental / oversized display | Anek Bangla |
- **Color palette**:
  | Token | Direction |
  |---|---|
  | Background | Warm ivory / paper |
  | Primary text | Ink black |
  | Accent | Muted brick red |
- **Visual reference** (moodboard the user attached — ÈRRA ATELIER,
  ATELIE, HAUS STUDIO): asymmetric editorial grids, large full-bleed
  photography, minimal chrome, slow reveals and subtle scroll-driven
  motion. Elegant and classy, not a generic e-commerce template.

## 1. Reference flow — richardgeorge.uk/mens-tailoring/

Researched directly (pages fetched: `/mens-tailoring/`, `/booking/`,
`/made-to-measure/`, `/mens-tailoring/bespoke-tailoring/`) rather than
assumed. Key finding: **this is an appointment/consultation-led site, not
a self-service configurator.** No fabric picker, no measurement form, no
pricing, no online payment anywhere on the site. The "customization" is
described in marketing copy (hours of craftsmanship, number of fabric
options) but actually happens in person, guided by staff.

**Site structure** (adopting this shape, re-skinned and simplified):
- **Home** — large typography hero, full-bleed photography, editorial
  tone ("Tailoring is the by-product. Emotion is the focus.")
- **Approaches / Collections** — a small set of service-type cards (e.g.
  "Made to Measure", "Bespoke") — asymmetric grid, large imagery, minimal
  product information, each linking to its own page describing the
  *process* (not a product catalog)
- **Journal** (optional, can ship empty/deferred) — editorial articles
  building brand trust
- **Client Stories** — testimonial gallery
- **Showrooms** — static location/contact info (adapt to our actual
  Bangladesh location(s))
- **Booking** — the *one* functional flow on the whole site:
  1. **What are you looking for?** — service type (radio choice)
  2. **Garment category** — a short named list (no fabric/measurement
     detail at this stage)
  3. **Contact details** — name, email, phone, optional note → submit
  - After submission: a plain confirmation ("we'll contact you to
    arrange a consultation") — no calendar, no deposit, no quote shown
    online anywhere on the reference site.

This is the structure we copy. The *visual* design is entirely our own
(§0), not copied from richardgeorge.uk.

## 2. What this means for our build

- **Order flow simplifies drastically**: from a live sketch + per-garment
  measurement-slider configurator down to a 3-step enquiry form
  (service type → garment category → contact info), matching the
  reference site's actual flow. No measurements collected online. No
  fabric picker. No fit types. No live sketch rendering.
- **Admin side simplifies to match**: a plain enquiries list (who asked
  for what, contact info, a simple status — e.g. new → contacted →
  confirmed → done), not the quote/payment/production-stage pipeline the
  old plan built.
- **Payments**: not part of this flow at all (the reference site doesn't
  take payment online either) — SSLCommerz and the whole payment/invoice
  machinery stay out of this rebuild entirely, not just archived.

## 3. Backend: what's removed vs. what stays

**Removed** (not just archived-in-place — deleted from this branch; still
fully present in `dev`/`main`'s history if ever needed again):
- The 14-field measurement profile, fit types, lapel styles
- The full order-status pipeline (quoted/declined/cutting/stitching/
  ready/completed), order status history
- Fabric picker / fabric catalog
- Payments / SSLCommerz integration entirely
- Notifications service (tied to the old order pipeline)
- Reports/analytics endpoint

**Stays, as the skeleton this branch builds forward from**:
- Auth: signup, login, JWT middleware, admin role (`users` table only)
- Health check endpoint
- Basic Express app structure, middlewares (async handler, error
  handler, 404, requireAuth/requireAdmin)
- Basic frontend routing (React Router), `AuthContext`, protected routes,
  Login/Signup pages
- Project tooling unchanged: Vite, Tailwind, Express, raw SQL via `pg`,
  Postgres in Docker for dev, the same deploy targets (Vercel frontend /
  Render backend / hosted Postgres) from the original CLAUDE.md

**New, minimal** (built in a later task, not part of the skeleton push):
- A single lightweight enquiries table: id, customer reference (nullable
  — a guest can submit without an account), name, email, phone, service
  type, garment category, note, status, created_at. No measurements, no
  pricing, no payment fields.

## 4. Branch plan

- `dev` / `main`: **left untouched.** They stay exactly as they are as the
  historical record of the full live-customization build. No renaming, no
  force-push, nothing destructive.
- **`Dev_exp`** (this branch): created from `main`, stripped down to the
  bare skeleton described in §3 ("stays"), with everything in "removed"
  deleted. All new work for this redesign happens here, going forward.

## 5. Next steps (sequencing only — not yet broken into a formal task plan)

1. Push the stripped skeleton to `Dev_exp` (this session, immediate).
2. Design system: color tokens, the three typefaces, logo exploration
   (three directions, §0).
3. Homepage: hero, editorial sections, asymmetric layout.
4. Approaches/collections pages (service-type cards).
5. Booking: the 3-step enquiry form (§1).
6. Admin: plain enquiries list + status.
7. Journal / Client Stories — can follow once the core flow is live.

Tech stack, deploy targets, and model-role conventions are unchanged from
the original project setup (see `CLAUDE.md`).
