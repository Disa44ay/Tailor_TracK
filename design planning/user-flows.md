# FIERO (fiero.com.bd) — user flows and site architecture

Companion to `design-reference.md`. Documents exactly which control leads
where, and the end-to-end paths a visitor can take, as observed by browsing
the live site on 2026-11-24.

## Site map (every route discovered)

```
/                              Home
/about                         About
/price-chart                   Price Chart
/book-appointment               Book Appointment (landing — service tiles)
  /book-appointment/ola/services/custom-clothing   per-service booking widget
/career                         Career
/gallery                        Gallery
/royalty-program                 Royalty Program
/shop                           Shop (empty)
  /shop?olsPage=cart            Cart (slide-over, available from every page)
/m/account                      → redirects to /m/login (sign-in)
/m/login                        Sign-in form
/m/create-account               Create-account form
/m/bookings                     Signed-in: booking history
/m/orders                       Signed-in: order history
/f/<slug>                        Individual blog post (e.g.
                                 /f/a-new-custom-tailoring-experience-in-dhaka)
/terms-&-conditions             Terms (duplicate #1)
/terms-and-conditions           Terms (duplicate #2)
/privacy-policy                 Privacy Policy
```

External destinations linked from the site (not part of the site itself):
- WhatsApp chat: `wa.me/8801610209999`
- Phone dial: `tel:+8801610209999`
- Google Maps pin for the studio
- Instagram (`instagram.com/fierobd`), Facebook, LinkedIn, X profiles
- Google's own Privacy Policy / Terms (reCAPTCHA notice boilerplate)

## Global navigation (available from every page)

| Control | Destination | Notes |
|---|---|---|
| Logo | `/` | |
| Cart icon | `/shop?olsPage=cart` | Opens a slide-over cart panel, not a new page |
| Hamburger menu | expands in place | Reveals the full nav list below |
| Home / About / Price Chart / Book Appointment / Career / Gallery / Royalty Program / Shop | their respective pages | Flat, single-level nav — no dropdowns/sub-nav |
| Sign In (logged out) | `/m/account` → `/m/login` | |
| Create Account (logged out) | `/m/create-account` | |
| Bookings / Orders / My Account (logged in) | `/m/bookings` / `/m/orders` / `/m/account` | |
| Sign out (logged in) | returns to logged-out nav state | |
| Footer "Book Appointment" button | `/book-appointment` (though one instance on the About page's footer link oddly points to `/`) | |

## Flow 1 — Primary conversion path: booking an appointment

This is the site's one real "transaction." Everything else (About, Gallery,
Price Chart, blog) exists to build trust before a visitor reaches this flow.

```
Any page
  └─ click "Book Appointment" (hero button, nav link, or footer button)
       └─ /book-appointment
            ├─ see 2 service tiles: "Schedule Consultation at FIERO Studio"
            │    vs "Online Consultation" (same duration/price, different
            │    delivery mode — in-person vs virtual)
            └─ click "Book" on a tile
                 └─ /book-appointment/ola/services/custom-clothing
                      ├─ (optional) change "Any Available Staff" → a named
                      │    tailor/stylist
                      ├─ browse the month calendar (prev/next arrows);
                      │    unavailable days are greyed and inert, available
                      │    days are clickable circles
                      ├─ click an available day
                      │    └─ time-slot buttons render below, grouped into
                      │         Morning / Afternoon / Evening (only groups
                      │         with real openings appear)
                      ├─ click a time slot
                      │    └─ (next step not completed in this analysis —
                      │         avoided submitting a real booking to a live
                      │         third-party business; the pattern strongly
                      │         implies a contact-details step — name,
                      │         phone, email, and the visible prompt "let us
                      │         know your budget plan and date" — followed
                      │         by a confirmation, standard for GoDaddy's
                      │         Online Appointments product)
                      └─ (fallback) scroll past the widget to a plain
                           Name/Email lead form — "We would love to hear
                           from YOU!" — for a visitor who doesn't want to
                           commit to a specific slot yet
```

Secondary entry into the same intent, bypassing the calendar entirely:
```
Home → "Appointment" card (Name, Email*, Contact*, design-reference
  attachment, Send Message) → human follow-up, no scheduling UI at all
```
and
```
Any page → WhatsApp link → conversation moves entirely off-site
```

So there are **three parallel paths to the same outcome** (book a
consultation), of increasing commitment and decreasing friction:
1. Pick an exact date/time in the calendar widget (most structured).
2. Fill the "Appointment" lead form and wait for a human to schedule you.
3. Message on WhatsApp and arrange everything conversationally.

## Flow 2 — Account creation / sign-in

```
Any page → Sign In → /m/login
  ├─ enter email + password → Sign in → signed-in nav state (Bookings,
  │    Orders, My Account, Sign out appear)
  ├─ "Reset password" → (password-reset flow, not inspected)
  └─ "Not a member? Create account." → /m/create-account
       └─ fill account fields + reCAPTCHA → Create Account
            → signed-in state, opted into newsletters/promotions by default
```
Note: account creation is entirely disconnected from the booking flow above —
a visitor can book a consultation (Flow 1) with zero account, and separately
create an account (Flow 2) that exists only to view booking/order history
later. There is no "create an account as part of checkout" step forcing the
two together.

## Flow 3 — Shop / checkout (currently a dead end)

```
Any page → cart icon → cart slide-over ("Your cart is empty")
Shop nav link → /shop → "New products are coming soon!"
```
The cart and checkout chrome exist everywhere (footer cart summary, cart
icon, "Checkout" button) but there's nothing to buy — this is infrastructure
switched on ahead of actual product listings.

## Flow 4 — Career application

```
Career → /career
  └─ read the 11 open roles (plain list, no per-role pages)
       └─ fill the one shared Apply Now form (Name, Phone, Email*, Resume)
            → Submit Application
```
Flat and single-step — no role selection field, so FIERO's team must infer
which role an applicant wants from the attached resume or a follow-up.

## Flow 5 — Royalty program sign-up

```
Royalty Program → /royalty-program
  └─ read the 12-buy-13th-free pitch
       └─ fill Apply Now (Name*, Phone*, Email*, Designation*)
            → Submit Membership Request
```
Also a lead-capture form, not a self-service enrollment — "please... inform
us on your next order" implies a human reconciles membership status against
actual purchase history, there's no automatic tracking visible to the member.

## Flow 6 — Content/trust-building browsing (no conversion, supports Flow 1)

```
Home → "My Blog" → Continue Reading on a post → /f/<slug> → read → (dead end,
  no related-posts or back-to-blog-list link observed in the crawl)
Home → Instagram/Facebook/LinkedIn/X icons → leaves the site entirely
Home → FAQ accordion → expands in place, no navigation
About → reads founder/company story → no CTA on the page itself except the
  always-present global nav/footer
Price Chart → reads prices → no "customize this" action, just numbers
Gallery → scrolls images → "Show More" paginates in place
```

## Architecture notes

- Built on **GoDaddy Website Builder** (`generator` meta tag confirms this)
  with the **GoDaddy Online Store** (e-commerce/cart) and **GoDaddy Online
  Appointments** (the `/book-appointment/ola/...` booking widget) add-ons
  bolted on. This is a hosted SaaS site builder, not custom-coded — explains
  why Terms & Conditions exists as two near-duplicate pages (likely two
  separate GoDaddy-template blocks added at different times) and why the
  account system (`/m/*`) is generic/unbranded in its copy ("Account sign
  in... access your profile, history, and any private pages you've been
  granted access to" is boilerplate GoDaddy copy, not FIERO-specific).
- **No single-page-app routing** — every nav click is a full page load
  (consistent with a GoDaddy-builder site), except the booking widget itself,
  which behaves like an embedded app (calendar/time-slot interaction updates
  without a full reload).
- **Three disconnected "contact" surfaces** (the booking calendar, the
  Name/Email lead form repeated on Home and Book Appointment, and WhatsApp)
  rather than one unified intake — each was evidently added independently
  over time rather than designed as one flow.
- **No customer-facing order/measurement state machine** — compare to
  TailorTrack's order-status pipeline (requested → quoted → confirmed →
  cutting → stitching → ready → completed) and live garment customization;
  FIERO has nothing structurally equivalent. Its "Bookings"/"Orders" pages
  are generic GoDaddy account history, not a tailored tracking experience.
