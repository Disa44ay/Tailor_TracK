# Final review fix wave — report

## Fix 1: literal hex removed from inline SVGs (required)

**`frontend/src/components/home/HomeNav.jsx`**
- `TapeMeasureCaseIcon` (line ~32): `stroke="#2B2A28"` / `fill="#2B2A28"` on the rect/circle elements → `currentColor`; `<svg>` now has `className="text-ink"`.
- `TapeMeasureUnrolledIcon` (line ~43): same change on the rect/lines, `className="text-ink"` on the `<svg>`.
- Removed the false "per the brief" clause from the `TapeMeasureCaseIcon` comment; kept the accurate half as `// shortcut: hand-drawn icon approximated with a rounded rect + dial.`

**`frontend/src/components/home/Hero.jsx`**
- `GarmentIllustration` (line ~50): outer `<svg>` now has `className="text-ink"`, and all garment-outline/button paths and circles use `stroke="currentColor"` / `fill="currentColor"`.
- The stitching path and its four tick marks (previously `#203A8C`) are wrapped in `<g className="text-accent">...</g>` with `stroke="currentColor"`, so they resolve to the accent token independently of the ink-colored elements around them.
- Removed the false "per Task 1's SVG exception" clause; kept the accurate half as `// shortcut: hand-drawn silhouette approximated with simple paths.`

Visual result is unchanged: `--color-ink: #2B2A28` and `--color-accent: #203A8C` are the literal values declared in `frontend/src/index.css`'s `@theme` block, so `currentColor` resolves to the exact same colors as before — verified by reading `index.css` directly, not by browser screenshot (no visual diff needed since the same hex values are now sourced from the token instead of hardcoded).

## Fix 2: mobile menu now closes on link tap

`frontend/src/components/home/HomeNav.jsx`, both mobile links inside `#home-mobile-menu` (the `<Link>` and the `<a>`) now have `onClick={() => setOpen(false)}` added alongside their existing `tabIndex` prop.

## Fix 3: page title

`frontend/index.html` line 10: `<title>web</title>` → `<title>TailorTrack</title>`.

## Test results

- Before: not captured this session (no baseline run was taken prior to editing; HEAD at start was `c3b0a1d`, all 6 plan tasks previously approved).
- After (`npx vitest run` from `frontend/`): **12 test files passed, 33 tests passed**. Re-ran after restoring the `shortcut:` comment text; same result (12/12 files, 33/33 tests).

## Self-review

- Grepped both target files for `#2B2A28` and `#203A8C` after editing: no matches.
- Broadened the grep to `#[0-9a-f]{3,8}` case-insensitive across `frontend/src/**/*.jsx,*.js` (excluding `index.css`): only hits are the literal order-number strings `"#108 — Suit"` and `"#112 — Panjabi"` in `Hero.jsx`'s `StickyNote` labels — text content, not colors, out of scope for this fix.
- Confirmed `onClick={() => setOpen(false)}` was added to both mobile links, not just one.
- Confirmed `<title>TailorTrack</title>` is in place.
- Did not touch the `transition-[scale,opacity,max-height]` arbitrary value, the gradient-wash background, the duplicated corner-bracket pattern, font-loading scope, missing tabIndex test coverage, the stale Task-13 comment in `Home.jsx`, the unused `describe` import in `HomePage.test.jsx`, or `HowItWorks`' heading tag — all out of scope per the brief.

## Concerns

None. All three fixes are small, isolated, and the full suite passes with no changes needed to tests.
