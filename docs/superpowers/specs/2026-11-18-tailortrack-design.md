# TailorTrack — Design Doc

Date: 2026-11-18

## Intent and why

A friend runs a single tailoring shop and currently tracks orders and
measurements through notebooks and chat messages. Customers repeatedly
contact the shop just to ask for status updates, deadlines and payments
are hard to monitor, and measurements get misplaced. TailorTrack is a
web app, built as a varsity project, that replaces that with one
role-based platform: customers submit requests and track their own
orders, the shop's admin manages the whole workflow from a dashboard,
and everything lives in one central database.

## Goals

- Customer account: sign up, sign in, manage profile.
- Measurement profile: save and update body measurements.
- Submit a tailoring request (garment type, style, notes).
- Track order status end to end, including being told *why* if
  something needs attention.
- Admin: single owner/operator account that reviews incoming requests
  (reject outright with a reason, or quote a price and due date),
  advances orders through the remaining stages, records the remaining
  balance payment, and pulls simple reports.
- Customer picks a priority when submitting (normal, fast, urgent) and
  can add a custom note/instruction. The admin quotes a fixed due date,
  total price, and required advance amount in response; the customer
  then confirms or declines that invoice — both sides have a say
  before an order is actually scheduled.
- Confirming an invoice pays the required advance through a sandboxed
  SSLCommerz checkout (demo/test credentials, not a live gateway); the
  transaction ID returned is stored as proof of that payment. There is
  no "pay later" for the advance — confirming and paying happen
  together.
- Two-way, one-way-per-message in-app notifications: the system
  generates one automatically on key events (new request submitted →
  notifies admin; status change → notifies customer), and the admin can
  always attach or send free-text custom messages (e.g. "the fabric you
  wanted isn't available right now") on top of or instead of the
  automatic one. Customers (and admin) mark a notification as read by
  clicking it.
- Reject → edit → resubmit loop: when the admin rejects a request with
  a reason, the same order record moves to a "needs changes" state: the
  customer edits it (a PATCH from their side) and resubmits, and it
  goes back to the review queue as the same order, not a new one.

## Non-goals

- Not multi-tenant. One shop, one admin, one customer list — no
  business/shop ID anywhere in the schema.
- No multiple staff/tailor accounts and no "assign this order to that
  tailor" logic. One admin role does the entire workflow.
- No *live* payment gateway. The advance payment goes through
  SSLCommerz's sandbox/test environment (`is_live: false`, test store
  credentials) — a real-shaped payment flow with no real money moving.
  The remaining balance is still just manually recorded by the admin
  (e.g. cash at pickup), matching the proposal's "record advance /
  balance" wording.
- No email or SMS. Notifications are in-app only, fetched when the
  user is in the app.
- No reply threads. Every notification is one-way (system → someone,
  or admin → someone); nobody replies to a notification through the
  system itself.
- No real-time infrastructure. Notifications are fetched on page
  load / refresh; no websockets or push needed at this scale.

## Anti-goals

Things that would make this a failure even if it technically runs:

- An admin flow that's more cumbersome than the notebook it replaces.
- Losing an order's history when it's rejected and resubmitted — it
  must stay one record with a visible trail, not fork into duplicates.
- A notification system the admin has to fight with to use — sending
  the automatic notification must be the default/free action; adding
  custom text is optional, never required busywork.

## Constraints

- Stack is already decided (recorded in this project's `CLAUDE.md`):
  React/Vite in plain JS (frontend), Express with raw SQL via `pg`
  and no ORM (backend), Postgres (database — Docker locally, Neon or
  Supabase in production), deployed to Vercel + Render.
- Git workflow is already set: `main` stays clean and deployable; all
  work happens on a dev/feature branch; code only merges to `main` on
  the user's explicit approval (also in `CLAUDE.md`).
- Small varsity-project scope. Prefer the simplest design that's
  actually correct over anything more "architecturally impressive."
- Auth is JWT (sent as an `Authorization` header), not server-session
  cookies — my own call, since the React frontend (Vercel) and
  Express backend (Render) are on different domains, where cookie-based
  sessions get awkward cross-origin.
- SSLCommerz sandbox needs its own free test-store registration
  (separate store ID/password from any eventual live account) before
  the payment endpoints can be built against it.

## Approaches considered

Two ways to model orders, status changes, and notifications were
weighed:

1. **Normalized relational tables + a status-history log.** Plain
   `orders` table with a status column, plus an `order_status_history`
   table recording each transition (what changed, when, optional
   note). Current state is just a column read; history is a separate,
   append-only log for the trail both sides can see.
2. **Event-sourced single `events` table.** Every change (new request,
   accept, reject, stage change, payment, notification) is one row in
   a generic events table, and "current status" is computed by
   replaying a given order's events.

Chose **(1)**. It answers "what's this order's status right now" with
one indexed read instead of a replay, which matters for a dashboard
that lists many orders at once, and it's the simpler thing to reason
about and debug for a project this size. Event sourcing's extra
auditability isn't worth the extra machinery here — a plain history
table already gives both sides a visible trail.

## Revision note

After research into real Bangladeshi tailoring/clothing sites (see
[`docs/revised-idea.md`](../../revised-idea.md)), one field was added
and two previously-open "left to the builder" items were resolved with
concrete defaults. Everything else below reflects that revision.

## Revision note 2: expanded measurements and fit types

After researching real bespoke/made-to-measure guides (Propercloth,
Luxire, Gentleman's Gazette, Permanent Style, Brooks Brothers, plus
Bangladeshi retail/press coverage of panjabi styles — Daily Star, TBS,
Rokomari, Blucheez), two things changed:

1. **7 new measurement fields.** The original 7 only partially cover
   what a professional tailor actually asks for per garment:
   - Shirt needs bicep and wrist (cuff sizing) beyond chest/neck/shoulder/sleeve.
   - Pant needs thigh, knee, rise, and hem beyond waist/hip/inseam.
   - Suit needs bicep plus an overall jacket length.
   - Panjabi/kurta needs an overall garment length — the single most
     distinctive panjabi measurement, far more variable than a shirt's.

   `garment_length` is shared between suit jackets and panjabi/kurta
   (same concept — how far the outer garment falls — just different
   typical ranges) rather than two near-duplicate columns.

2. **Lapel width and shoulder padding are style choices, not body
   measurements.** Every source treats them as something the customer
   picks, the tailor executes — never something taken with a tape.
   This becomes two order-level fields instead of new measurement
   columns: `fit_type` (a cut/ease instruction, e.g. `slim`,
   `relaxed`) and, suits only, `lapel_style` (`notch` | `peak` |
   `shawl`). The earlier English-vs-Italian framing is folded into
   `fit_type`'s suit options rather than a separate field.

**Decided: `fit_type` by garment** (`backend/constants/fitTypes.js`,
validated against the right list for the order's `garment_type`;
`other` allows any value):

- **shirt** / **blouse**: `slim`, `regular_classic`, `tailored`, `relaxed`, `formal_office`
- **pant**: `slim`, `straight`, `bootcut`, `relaxed`, `office_formal` (pleated) — bootcut is kept because the user asked for it by name, though trouser-fit guides treat it as mainly a jeans term, not a standard dress-trouser cut; flagged here rather than silently dropped.
- **suit_2pc** / **suit_3pc**: `italian_soft`, `english_structured`, `modern_slim`, `relaxed_comfort`, `double_breasted`
- **panjabi** / **kurta**: `slim_fit`, `regular_fit`, `loose_classic`, `short_pathani`, `patiala_festive`

**Decided: measurement relevance by garment** (`backend/constants/measurementRelevance.js` — a frontend display concern, not a DB constraint; the full snapshot is always stored, this just drives which fields a garment's order form shows):

- **shirt** / **blouse**: neck, chest, shoulder_width, sleeve_length, bicep, wrist, waist
- **pant**: waist, hip, inseam, thigh, knee, rise, hem
- **suit_2pc** / **suit_3pc**: neck, chest, shoulder_width, sleeve_length, bicep, waist, garment_length, hip, inseam, thigh, knee, rise, hem (a suit order covers both jacket and trouser)
- **panjabi** / **kurta**: neck, chest, shoulder_width, sleeve_length, garment_length
- **other**: all 14 fields

**Non-destructive by design:** "only show relevant fields, rest default
to 0" is a form-display rule, not a data rule — an order form never
shows the irrelevant fields, and an unfilled numeric field displays as
0, but nothing overwrites a customer's actual stored measurement. A
customer who measured their chest for a shirt order keeps that value
on file when they later order pants, even though the pants form never
shows it.

## Decided: order lifecycle (state machine)

```
Requested (garment, custom note, priority: normal/fast/urgent)
    │
    ├──(admin rejects outright, e.g. fabric unavailable, with a reason)──► NeedsChanges
    │                                                                           │
    │                                                        (customer PATCHes the order)
    │                                                                           │
    │                                                                           ▼
    │                                                                       Requested  (back to review)
    │
    └──(admin quotes: due date + total price + required advance)──► Quoted (invoice sent)
                                                                          │
                                              ┌───────────────────────────┴───────────────────────────┐
                                              │                                                         │
                                   customer declines (simple no)                          customer confirms
                                              │                                                         │
                                              ▼                                                         ▼
                                          Declined (terminal —                          SSLCommerz sandbox checkout
                                      to try again, submit a                              (pays the advance amount)
                                       brand-new request)                                               │
                                                                               ┌───────────────────────┴───────────────────────┐
                                                                               │                                                 │
                                                                      payment succeeds                                 payment fails/cancelled
                                                                               │                                                 │
                                                                               ▼                                                 ▼
                                                            Confirmed ─► Cutting ─► Stitching ─► Ready ─► Completed        stays Quoted (retry)
                                                        (admin records the balance payment manually
                                                                 once the item is collected)
```

- `Declined` is a dead end on purpose and is **not** the same as
  `NeedsChanges`: once the admin has sent a fixed due date and price,
  confirming is a plain yes/no, not a negotiation. A "no" doesn't loop
  back for edits — if the customer still wants the order, they submit a
  fresh `Requested` order. `NeedsChanges` stays reserved for the
  admin's own outright rejection (e.g. "that fabric isn't available"),
  which is explicitly meant to be editable and resubmitted as the same
  order.
- `Completed` is a final stage beyond `Ready`, set by the admin once
  the customer actually collects the order — this keeps "Ready" (sitting
  in the shop) distinguishable from "done and gone" in reports. This is
  my own call, not something explicitly in the proposal, since the
  proposal's mockups stop at "Ready."
- A rejected (not declined) order never forks — it's the same row,
  status flips to `NeedsChanges`, and the customer's resubmission flips
  it back to `Requested`.

## Decided: data model (high level)

- **users** — id, name, email, password_hash, role (`customer` |
  `admin`), country_code, phone_number (exactly 11 digits — the local
  number, not including the country code), created_at. Phone and
  country code are required at customer signup — notifications stay
  in-app as the primary channel, but the admin needs a real number on
  file for when a customer needs calling directly (a fitting issue, a
  delivery problem). Not required for the seeded admin account.
- **measurements** — id, customer_id (FK), 14 numeric fields: the
  original 7 (chest, waist, hip, shoulder_width, sleeve_length,
  inseam, neck) plus 7 added after researching real bespoke-tailoring
  measurement guides (bicep, wrist, thigh, knee, rise, hem,
  garment_length — see "Revision note 2" below), updated_at. Which
  fields are relevant to a given garment is a frontend-facing concern
  (`backend/constants/measurementRelevance.js`), not a DB constraint —
  the table stores whatever the customer has filled in, full stop;
  irrelevant-to-this-order fields are just not shown on that order's
  form, never zeroed or overwritten.
- **orders** — id, customer_id (FK), garment_type, style_notes,
  fabric_note (nullable text — e.g. "bringing my own fabric," "prefers
  navy wool blend"; read by the admin before quoting, never a fabric
  catalog or priced item — see the revision note above), fit_type
  (nullable text — a cut/ease instruction like `slim` or `relaxed`,
  from a garment-type-specific list, see "Revision note 2"), lapel_style
  (nullable text, `notch` | `peak` | `shawl` — suits only), priority
  (`normal` | `fast` | `urgent`), status (enum per the lifecycle
  above), a measurements snapshot taken at request time (so an order
  keeps the numbers it was actually built against, even if the
  customer's live profile changes later), due_date, quoted_price,
  advance_required, created_at, updated_at.
  `due_date`, `quoted_price`, and `advance_required` are all null until
  the admin quotes the order; the customer never sets them.
- **order_status_history** — id, order_id (FK), from_status,
  to_status, note (the custom text attached to that transition, if
  any), changed_by (`admin` | `system` | `customer` — the resubmit and
  decline transitions are the customer's own action), created_at.
- **payments** — id, order_id (FK), type (`advance` | `balance`),
  amount, gateway_transaction_id (nullable — set for the advance
  payment made through SSLCommerz sandbox; null for the manually
  recorded balance payment), recorded_at.
- **notifications** — id, sender (`admin` | `system`), recipient_id
  (FK to users — the admin's own user row, or a customer), message,
  order_id (optional FK, for notifications tied to a specific order),
  is_read (bool), created_at.

## Decided: API surface (high level, REST)

- Auth: `POST /auth/signup` (customer self-signup), `POST /auth/login`.
  The admin account is seeded, not publicly signed up — there's only
  one, for one shop.
- Measurements: `GET /me/measurements`, `PUT /me/measurements`.
- Orders (customer): `POST /orders` (garment, note, fabric_note, priority),
  `GET /orders`, `GET /orders/:id`,
  `PATCH /orders/:id` (only while status is `NeedsChanges`),
  `POST /orders/:id/decline` (only while status is `Quoted`),
  `POST /orders/:id/confirm` (only while status is `Quoted`; starts
  the SSLCommerz checkout for the advance).
- Orders (admin): `GET /admin/orders` (filterable by status),
  `PATCH /admin/orders/:id/reject` (with a reason → `NeedsChanges`),
  `PATCH /admin/orders/:id/quote` (due_date, quoted_price,
  advance_required → `Quoted`),
  `PATCH /admin/orders/:id/status` (advance a production stage;
  accepts an optional custom note sent alongside).
- Payments: `POST /payments/sslcommerz/init` (starts the sandbox
  checkout for an order's advance), `POST /payments/sslcommerz/callback`
  (SSLCommerz's own success/fail/cancel callback — validates the
  transaction, records the `payments` row, and moves the order to
  `Confirmed` on success). Balance: `POST /admin/orders/:id/payments`
  (admin manually records the balance payment).
- Notifications: `GET /me/notifications`, `PATCH
  /me/notifications/:id` (mark read), `POST /admin/notifications`
  (custom message to a specific customer, optionally tied to an order).
- Reports (admin): `GET /admin/reports` (order counts by status,
  payment totals collected, and outstanding = `quoted_price` minus
  payments recorded, per order and in total).

## Decided: garment types and measurement fields

Resolved by the research in `docs/revised-idea.md`, no longer open:

- `garment_type`: a fixed list — Shirt, Pant, Panjabi, Suit (2-piece),
  Suit (3-piece), Kurta, Blouse — plus an `Other` option with free text.
- Measurement fields: chest, waist, hip, shoulder width, sleeve length,
  inseam, neck.

## What's left to the builder

- UI beyond the two mockup concepts already in the proposal
  (dashboards, order board) — exact layout, components, styling.
- Field-level validation rules (what's required per garment type,
  measurement ranges, etc.).
- Whether `Completed` needs its own explicit admin action/button, or
  some other trigger — the lifecycle above fixes the states, not the
  exact UI for the final transition.
- The exact PATCH payload accepted during `NeedsChanges`: it edits the
  order's own measurement snapshot, garment type, style notes, and
  priority — it never writes back to the customer's standing
  `measurements` profile, since the snapshot exists precisely so the
  two can diverge.
