# Revised idea — lessons from real Bangladeshi tailor/clothing sites

Date: 2026-11-18

I couldn't find live sites for "Gentleman's Wardrobe" or "Western
Tailors" specifically (no working site turned up under either name).
Instead I looked at real Dhaka-based tailoring/clothing businesses that
do take orders online and describe their process publicly: **Shirtology
BD** (shirtologybd.com — read its FAQ in full), **Bishworang**
(bishworang.com.bd — read its FAQ in full), plus reporting on **RulMaker
Shirts**, **The Blouse House**, **FIERO**, **Dapper Bespoke**, **Fit
Elegance**, and **Concept House BD** from Daily Star/TBS/Bangladesh
Monitor coverage. Sources are listed at the bottom.

## What this confirms we already got right

- **Quote-based pricing for custom work, not a price list.** None of
  these sites show a live price for a bespoke/made-to-order piece.
  Shirtology's FAQ sends custom/bulk inquiries to "contact them with
  your quantities, deadline, and preferred fabrics so we can quote you
  quickly." Dapper Bespoke won't even finalize without a trial/fitting.
  That's exactly our design: the admin quotes a price after reviewing
  the request, not an auto-computed number. No change needed here —
  this rules out building a pricing engine, which would've been
  overengineering for what real shops this size actually do.
- **Self-measurement against a guide, not a mandatory home visit.**
  Shirtology tells customers to "measure your chest, waist, and length,
  then compare against the size chart." Home visits exist (RulMaker
  charges an extra Tk 1,050 for one, Dhaka-only) but as a paid add-on,
  not the default online flow. Our customer-entered measurement profile
  already matches the default flow real sites use.
- **SSLCommerz is a real, standard choice here**, not an arbitrary
  pick — it's the payment banner shown on Shirtology's own checkout,
  alongside bKash/Nagad/bank transfer/COD. Confirms the sandbox
  decision from the design doc fits how Bangladeshi sites actually
  take payment, nothing invented.

## The one real gap: fabric isn't in our design at all

Every one of these businesses treats fabric as central to a tailoring
order, and our design doc never mentions it. But — and this matters for
not overengineering — **none of them run a fabric catalog with a
swatch picker and per-fabric pricing for custom/bespoke work.** That
pattern only shows up for their *ready-made* products (Shirtology sells
two specific ready fabrics at flat prices, Tk 520 and Tk 490, as
individual products you add to cart — that's retail, not bespoke).
For actual made-to-order pieces, fabric is handled the same way as
price: a conversation, not a storefront. Shirtology's custom-order
answer literally just says "tell us your preferred fabrics."

**Proposed addition — minimal, no new tables:** add one optional
free-text field, `fabric_note`, to the order submission (alongside
garment type, style notes, priority). The customer writes whatever's
relevant — "bringing my own fabric," "prefers navy wool blend,"
"like the fabric from my last suit" — and the admin reads it before
quoting. That's it. No fabric table, no swatch picker, no per-fabric
price list — building that would be solving a problem none of these
real sites solve for custom work, and it's not what the proposal or
your friend's shop asked for.

## Resolving two things the design doc left to "the builder"

Research gives concrete, real-world-grounded defaults instead of
leaving these open:

- **`garment_type` list:** a short fixed set — Shirt, Pant, Panjabi,
  Suit (2-piece), Suit (3-piece), Kurta, Blouse — plus an "Other"
  option with free text. This matches the range of garments these
  sites actually handle (shirts, suits, panjabi, blouse) without
  inventing categories nobody will use.
- **Measurement fields:** chest, waist, hip, shoulder width, sleeve
  length, inseam, neck — already proposed in the design doc — matches
  what Shirtology's own size-guide language uses (chest, waist,
  length) and what general made-to-measure guides describe (about a
  dozen body measurements). No change, just confirmed.

## Explicitly NOT doing (would be overengineering for this project)

- A fabric catalog/inventory table with stock levels and swatch images.
- Automatic price calculation from fabric type + garment type + size.
- A percentage-based advance formula — real sites use a flat,
  staff-decided number (Shirtology's outstation advance is a flat
  200 BDT, not a percentage), which is already exactly how our
  `advance_required` field works: the admin just types a number.
- Return/exchange or bulk-order policies — those are for ready-made
  retail, not a single bespoke order tracker; out of scope here.

## Net effect on the design doc

One field (`fabric_note`, nullable text on `orders`) and two "left to
the builder" items resolved into concrete defaults. No new tables, no
new states, no new endpoints. Everything else in the existing design —
lifecycle, quote/confirm/pay flow, notifications — stands as already
approved-pending.

## Sources

- [Shirtology BD — FAQ](https://shirtologybd.com/pages/faq-frequently-asked-questions)
- [Bishworang — FAQ](https://bishworang.com.bd/page/faq)
- [TBS News — RulMaker Shirts: Where fitting is top priority](https://www.tbsnews.net/node/367024)
- [TBS News — The Blouse House, for perfectly fitted blouses](https://www.tbsnews.net/node/544974)
- [TBS News — FIERO: Delivering custom-made suits directly to your doorsteps](https://www.tbsnews.net/node/226573)
- [Bangladesh Monitor — Fit Elegance: tailoring global standards for modern Bangladeshi wardrobe](https://www.bangladeshmonitor.com.bd/lifestyle-pdf/fit-elegance-tailoring-global-standards-for-modern-bangladeshi-wardrobe)
- [The Daily Star — suit tailoring cost context](https://www.thedailystar.net/node/1844125)

I could not confirm a business named "Gentleman's Wardrobe" or "Western
Tailors" exists in Bangladesh under those names — if you have a direct
link or social media page for either, I can look at those specifically
instead.
