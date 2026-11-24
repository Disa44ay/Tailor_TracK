# FIERO (fiero.com.bd) — design reference

Reverse-engineered from the live site on 2026-11-24 (browsing + scraping only —
no visual styling was copied; this is content and information-architecture
reference only, per the brief).

FIERO is a Bangladesh-based bespoke/made-to-measure tailoring business (Dhaka,
doorstep + studio model), built on GoDaddy Website Builder + GoDaddy's
"Online Store / Online Appointments" add-on. It is a marketing + booking site,
not a measurement/customization app — there is no live sketch, slider, or
fabric-swatch picker anywhere on it. That gap is exactly where TailorTrack
differs.

## Global chrome (present on every page)

- **Top utility bar**: a single line, "Find Us at [address]" — always visible,
  above the main header.
- **Header**: logo (left) · cart icon + hamburger menu (right, both collapsed
  behind the hamburger on narrow widths).
- **Nav menu** (in the hamburger): Home, About, Price Chart, Book Appointment,
  Career, Gallery, Royalty Program, Shop, then an account block:
  - Logged out: Sign In, Create Account
  - Logged in: Bookings, Orders, My Account, Sign out (with "Signed in as:
    {email}" shown above the links)
- **Footer** (same on every page): copyright + copyright-registration line,
  a short link list (About, Gallery, Terms & Conditions, Privacy Policy,
  Terms and Conditions — note: two separate "terms" links, likely a content
  duplication on their end), a repeated hero image + tagline + address +
  "Book Appointment" button, a cart summary ("Your cart is empty / Subtotal /
  Checkout"), and a cookie-consent banner (Decline/Accept).

## Page-by-page inventory

### Home (`/`)
Order top to bottom:
1. Hero: headline ("Bespoke & Made-to-Measure Clothing made with the finest
   fabrics") + one "Book Appointment" button.
2. "Our Services" — three service entries, each just a heading + link, no
   description: Home Service, Visit Our Studio, Virtual Appointments. All
   three link to the same Book Appointment anchor/flow except "Visit Our
   Studio," which links straight to a Google Maps pin.
3. An embedded "Appointment" booking form card: Name, Email*, Contact*, "For
   design reference" (an attachment field), Send Message — this is a direct
   lead-capture form sitting on the homepage, separate from the full booking
   flow in bullet 4 below.
4. "Not sure if we're the best fit?" — a soft reassurance block pointing to
   a WhatsApp link, plus the studio address, phone number, and a Google Maps
   "Get directions" link.
5. Instagram feed embed.
6. Facebook Reviews embed (placeholder — no reviews rendered in this crawl).
7. Social links row (Facebook, Instagram, LinkedIn, X).
8. Google Reviews embed (also empty in this crawl).
9. FAQ accordion, 5 questions: studio hours; how home service works (numbered
   steps); minimum order quantity for home service (split by whether the
   client brings their own fabric); whether they accept client-supplied
   fabric; whether they offer bank-card discounts.
10. "My Blog" — a filterable post list (category: "Customer Service"), each
    entry a title + one-line teaser + "Continue Reading" link. Six posts
    visible, dated June 2023 through September 2026 — an active content/SEO
    channel, not just a static page.
11. Email newsletter signup (single email field + Sign up button).
12. Footer (see Global chrome).

### About (`/about`)
Single long-form narrative page, no interactive elements beyond nav:
1. "The FIERO Story" — company history, 2017 founding through present,
   several paragraphs.
2. "Stylish Elegance" — a short brand-promise paragraph (image + text).
3. "My Services" — a second, prose-form restatement of the home-service
   pitch (duplicates content from the homepage's service cards, just in
   paragraph form).
4. "Meet the Founders" — names, roles, and a short founding-story paragraph.
No form, no CTA button on this page itself (only the global footer's
"Book Appointment").

### Price Chart (`/price-chart`)
A flat, scrollable price list — no filtering, no calculator, no interactivity:
1. "Our Offers" — a grid of ~16 product-category tiles (image + name + price
   or price range + one-line qualifier like "Including All Charges" or
   "High-Quality Fabrics"). Categories: Suits, Premium Suits, three Bespoke
   suit tiers (High-End/Premium/Luxury), Sherwani, Blazer, Linen Suits, Linen
   OverShirt, Shirts, Premium Shirts, Ready to Wear Shirts, OverShirt, Formal
   Pant, Panjabi, Casual Wear, Nehru Coat/Koti. Several entries say "Ask For
   Price" instead of a number.
2. "Making Charges - If Clients Provide Fabrics" — a second, separate flat
   list (no images), same categories, labor-only pricing when the customer
   supplies fabric themselves.
No garment customization, no fabric selection, no live quote — just published
reference prices.

### Book Appointment (`/book-appointment`)
The actual conversion page; JS-rendered widget (GoDaddy Online Appointments),
not plain content. Structure:
1. "Book Appointments" heading.
2. Two service tiles, each a card (image + title + duration + starting price
   + Book button): "Schedule Consultation at FIERO Studio" (1 hr, from 39,000
   BDT) and "Online Consultation" (1 hr, from 39,000 BDT — same price for a
   virtual session).
3. Clicking Book opens a per-service detail view at
   `/book-appointment/ola/services/custom-clothing`:
   - "< View all services" back-link
   - Service name, duration, starting price repeated
   - A staff picker, defaulted to "Any Available Staff"
   - A month calendar (prev/next month arrows), unavailable days greyed and
     unclickable, available days shown as outlined circles
   - Below the calendar, time slots grouped into Morning / Afternoon /
     Evening sections (only the sections with real openings render — e.g.
     the default day showed only an Evening group: 8:15, 8:30, 8:45, 9:00 PM)
   - A short instruction line: "Please let us know your budget plan and date
     when booking your appointment."
   - Social share icons (Facebook, X) for the service page itself.
4. Below the booking widget, a second, separate lead form: "We would love to
   hear from YOU!" / "Not sure if we're the best fit?" with Name, Email*
   fields — effectively the same general-inquiry form that appears on Home.

### Career (`/career`)
1. "We're Hiring!" heading, one short paragraph.
2. A plain numbered list of 11 open roles (Communication Executive, Design
   Intern, Studio Manager, Business Development, Stylist, Cutter Master,
   Executive-Accounts, Executive-Admin, Executive-Sales, Sewing Machine
   Operator, Intern) — no individual job-detail pages, no per-role apply link.
3. One shared "Apply Now" form for every role: Name, Phone, Email*, Attach
   Resume (file upload), reCAPTCHA notice, Submit Application. The applicant
   is never asked which role they want — a real gap if they ever need to
   route applications.

### Gallery (`/gallery`)
A flat image grid, no categorization, filtering, or lightbox metadata visible
in the crawl — just garment/studio photos, most without alt text, with a
"Show More" pagination control at the bottom.

### Royalty Program (`/royalty-program`)
1. Program pitch: a loyalty/punch-card model — buy 12 premium suits (or
   shirts, or client-fabric suits), get the 13th free; benefit window is 24
   months from registration.
2. "Apply Now" membership-request form: Name*, Phone*, Email*, Designation*
   (their job title — presumably for a B2B/corporate-account angle), Submit
   Membership Request.
Note: this is a manual, human-processed loyalty program — there's no visible
dashboard showing a member's progress toward their free item.

### Shop (`/shop`)
Empty placeholder: "All Products — New products are coming soon!" The GoDaddy
e-commerce cart/checkout machinery (visible in the global footer on every
page) is wired up site-wide but has nothing to sell yet.

### Account area (GoDaddy's built-in member system, `/m/*`)
- `/m/account` → actually resolves to `/m/login` — "Account sign in": email/
  password sign-in, "Reset password" link, "Not a member? Create account."
- `/m/create-account` — "Create Account": implied email/password fields (not
  rendered in the static crawl) + a disclosure that creating an account opts
  you into newsletters/promotions, reCAPTCHA.
- `/m/bookings` — presumably a signed-in customer's appointment history (not
  inspected directly; requires a real sign-in, which this analysis did not
  attempt).
- `/m/orders` — presumably Shop order history (same caveat; Shop itself is
  empty, so this is likely also empty today).
- `/m/account` (signed in) — "My Account" profile page (not inspected).

## What's structurally absent, relative to TailorTrack

- No live garment sketch/visualization anywhere — all "customization" is a
  human conversation (in-person, phone, WhatsApp) after a booking is made.
- No fabric catalog UI (swatches, colors, textures) — fabric choice happens
  physically, with a swatch book, during the appointment itself.
- No measurement form/profile — measurements are taken in person by a tailor,
  never entered by the customer online.
- No order-status tracking UI for the customer (no equivalent of
  TailorTrack's order board / notifications) — "Orders"/"Bookings" in their
  account area is the closest analog, and it's generic GoDaddy boilerplate.
- Pricing is static and published, not computed from a configured garment —
  there is no real-time "your custom shirt in this fabric costs X" moment
  anywhere on the site.
