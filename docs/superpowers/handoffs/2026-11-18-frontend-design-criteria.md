# Handoff: Frontend design criteria and process

For: the frontend chat (this chat stays backend-only; see `CLAUDE.md`)
Repo: `github.com/Disa44ay/Tailor_TracK`. Read `CLAUDE.md` first (model roles, git workflow, design-taste-frontend requirement).

## Context

Backend is done and reconciled on `main` (commit `9de5473`): auth, measurements, orders, SSLCommerz payments, notifications, reports. The frontend (Tasks 11-13) already exists on `main` too, but treat this doc as the design bar for any new frontend work or redesign from here on — new pages, new components, or revisiting existing ones.

## Mandatory process, per component or page

Do not build the whole frontend before showing anything. One component or one page at a time, in this order:

1. **`/superpowers:brainstorming`** — work out what this component/page needs to do and look like. Produce a blueprint (text sketch or mockup) and stop. Wait for explicit approval before writing any implementation code.
2. **`/hallmark`** — once a design is approved, run it through hallmark to strip AI-slop patterns (generic gradients, cookie-cutter cards, cliché copy, default shadow/spacing choices) before any code gets written. Use alongside the project's required `design-taste-frontend` skill, which covers the same ground from the codebase-conventions side.
3. **`/superpowers:test-driven-development`** — implement that one component/page test-first: write the failing test, watch it fail, write the minimal code to pass, refactor. If it works once, a test must guarantee it keeps working — no implementation without a test proving it first.
4. **`/ponytail:ponytail`** (full) — for all code and comments: smallest complete change, reuse existing patterns, no abstractions or config nobody asked for, comments only where the why isn't obvious from the code.

Then move to the next component or page and repeat. Nothing merges to `main` under the project's auto-merge rule unless its own tests are actually green.

## Design criteria (starting proposal — confirm with the user during brainstorming, don't just build this)

**Theme: scribbled notebook.** This is the non-negotiable starting brief — not generic SaaS, not flat corporate minimalism. The app should read like a tailor's own paper order book: hand-drawn, slightly imperfect, warm. This already matches the direction decided before Tasks 11-13 were built (see the original project handoff: hand-drawn "sketch" aesthetic, `rough.js` for sketchy SVG/canvas rendering, a hand-lettered Google Font for headings) — this doc makes it the explicit, mandatory baseline rather than an option to brainstorm away from.

| Role | Suggestion |
|---|---|
| Background | paper / cream (`#FAF6ED`-ish), optionally a faint lined-notebook or dot-grid texture on content areas — never pure white, never a flat corporate gray |
| Primary text / nav | ink/charcoal, not pure black — reads like pen on paper |
| Single accent | marker or ballpoint blue, or a warm red-brown like a stamped ink pad — used for buttons, links, active states, underlines |
| Status: urgent / attention | a hand-drawn-feeling warm red/orange, not Tailwind's default red-500 |
| Status: success / confirmed | a marker-green, slightly desaturated, not Tailwind's default green-500 |

Borders and dividers should look hand-drawn where `rough.js` is in play (wobbly lines, sketchy rectangles) rather than crisp 1px CSS borders — but don't force `rough.js` onto every pixel; the admin's dense data screens (order board, reports table) stay calmer and closer to a plain lined ledger page, per the original handoff's own distinction, so a speed-scanning admin isn't fighting sketchy rendering on a table of numbers.

**Typography.** A hand-lettered display font for headings and emphasis — `Caveat`, `Kalam`, or `Patrick Hand` (Google Fonts) are the named candidates from the original brief, pick one and use it consistently, not all three. Pair it with a plain, legible sans-serif for body text, form inputs, and anything data-dense (tables, measurement numbers) — a scribbled font on a price column is illegible, not charming. Two typefaces, not three.

**Component look.**
- Favor `rough.js`-rendered sketchy outlines and fills for customer-facing decorative chrome (cards, dividers, illustrative elements) over clean CSS borders and `shadow-lg` panels.
- A consistent "hand-drawn" family of shapes (slightly uneven rectangles, a consistent wobble/roughness setting) rather than a mix of perfectly crisp corners in one place and sketchy ones in another.
- No "icon in a gradient circle" pattern — it's a stock AI-generated-UI tell, and it also doesn't fit a notebook aesthetic at all.
- Generous whitespace / margin, like space left on a page, over dense stacked cards.
- A touch of imperfection is the point: a slight rotation on a sticky-note-style element, a hand-drawn checkmark or strike-through for completed states — but keep it legible and don't let it slow down the admin's working screens.

**Interaction.** Define these up front for every interactive element, not as an afterthought:
- hover / focus / active / disabled states, explicitly, not left to browser defaults
- loading state for anything that fetches (skeleton or spinner, consistently applied)
- inline form validation (as the user types or on blur), not just a toast after a failed submit

**Reusability.** Every visual primitive (Button, Input, Card, Badge, Modal, Table row, status pill) gets built once as a shared component and reused everywhere it appears. No copy-pasted markup for the same visual pattern across pages — if you're about to paste a card's JSX a second time, that's the signal to extract it first.

## What this doc is not

This is a starting point for the brainstorming conversation in that chat, not a final spec. If the user wants to skip straight to implementing this proposal, that's their call to make explicitly — the brainstorming skill's approval gate still applies either way.
