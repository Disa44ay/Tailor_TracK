# Handoff: Frontend design criteria and process

For: the frontend chat (this chat stays backend-only; see `CLAUDE.md`)
Repo: `github.com/Disa44ay/Tailor_TracK`. Read `CLAUDE.md` first (model roles, git workflow, design-taste-frontend requirement).

## Context

Backend is done and reconciled on `main` (commit `9de5473`): auth, measurements, orders, SSLCommerz payments, notifications, reports. The frontend (Tasks 11-13) already exists on `main` too, but treat this doc as the design bar for any new frontend work or redesign from here on — new pages, new components, or revisiting existing ones.

## Mandatory process, per component or page

Do not build the whole frontend before showing anything. One component or one page at a time, in this order. **Scope note:** Ponytail (step 5) governs *code generation only* — the smallest-complete-change, no-unrequested-abstraction discipline. It does not govern design exploration, debugging, or verification; those stay thorough, per the superpowers process each step names, even when that means more words or more passes than Ponytail would allow for code.

0. **`/superpowers:writing-plans` + `/superpowers:executing-plans`** — conditional, read this before deciding to skip it:
   - **Optional** for one simple, self-contained component: a plan can still be worth writing even here — it's the right place to pin down font alignment, spacing, states and everything else that's easy to leave implicit — but skip it if the component is simple enough that brainstorming alone covers it.
   - **Mandatory whenever a whole page is being generated at once** (several sections/components together, not one at a time). A page has cross-component relationships — alignment, spacing rhythm, which font carries which role where, load order — that get inconsistent if each section is improvised separately. Write the plan first (one task per section/component, each task's steps being this list), then run it with `executing-plans` task-by-task, with a ledger, rather than freehanding the whole page in one pass.
1. **`/superpowers:brainstorming`** — work out what this component/page needs to do and look like. Produce a blueprint (text sketch or mockup) and stop. Wait for explicit approval before writing any implementation code.
2. **`/hallmark`** — once a design is approved, run it through hallmark before any code gets written. Don't just eyeball it for "does this feel generic" — hallmark has an actual Floor (non-waivable) and Reflex/Finish gate system; use it for real. Checklist to hold every design against (full, current rules live in the skill itself — load it, don't rely on a copy pasted here):
   - Every color and font goes through a token, declared once (no literal hex/`font-family` scattered through markup).
   - No `transition: all`; never animate `width`/`height`/`top`/`left` (use `transform`/`opacity`).
   - No purple-to-blue gradient, card-in-a-card, emoji-as-icon, or "icon in a gradient circle" — the single most recognizable AI-generated-UI tells.
   - No eyebrow text or tracked small-caps labels; labels/captions/tags are body-face, sentence case, untracked.
   - No middle-dot-joined meta strings, arrows glued to link text, or decorative status dots.
   - No invented metric, testimonial, logo wall, or case-study count — ever.
   - Every interactive element has a visible `:focus-visible` state; every animation has a `prefers-reduced-motion` fallback.
   - Hero's headline + one sentence + primary action all visible at 1280×800 without scrolling; ~80 words max on any one screen.
   - Run `node <hallmark-skill-dir>/scripts/sloplint.mjs <output> --render` where Node is available — fix every FAIL, fix or waive every REFLEX.

   Use alongside the project's required `design-taste-frontend` skill, which covers the same ground from the codebase-conventions side.
3. **`/agentic-awesome-skills:unit-testing-test-generate`** — where necessary, before TDD: use it to scaffold the set of test cases a component/page needs (inputs, branches, edge cases, error states) so step 4's red-green-refactor cycle has a complete case list to work through instead of whatever comes to mind first. Skip it only when the component is trivial enough that the test list is obvious without it.
4. **`/superpowers:test-driven-development`** — implement that one component/page test-first: write the failing test, watch it fail, write the minimal code to pass, refactor. If it works once, a test must guarantee it keeps working — no implementation without a test proving it first.
5. **`/superpowers:systematic-debugging`** — the moment a test fails in a way you didn't expect, or something breaks while wiring the component up: stop and diagnose the actual root cause here, rather than patching around the symptom or guessing. This is a real step, not a footnote — invoke it.
6. **`/ponytail:ponytail`** (full) — for the code and comments written in step 4/5 only: smallest complete change, reuse existing patterns, no abstractions or config nobody asked for, comments only where the why isn't obvious from the code.
7. **`/superpowers:verification-before-completion`** — before calling the component/page done, actually prove it: run its tests and read the output, and where it's UI, load it in a browser and look at it. "The code looks right" is not verification. Don't declare a step finished from inspection alone.
8. **`/superpowers:requesting-code-review`** (or **`/superpowers:receiving-code-review`** if you're on the receiving end) — get an independent pass on the component/page before it's considered mergeable, even a quick one. Catches what the person who just wrote it won't see.

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

**Typography.** A hand-lettered display font for headings and emphasis — `Caveat`, `Kalam`, or `Patrick Hand` (Google Fonts) are the named starting candidates, pick one and use it consistently, not all three. Pair it with a plain, legible sans-serif for body text, form inputs, and anything data-dense (tables, measurement numbers) — a scribbled font on a price column is illegible, not charming. Two typefaces, not three. (Current confirmed pick, live in the design artifact: Shantell Sans for headlines/headers, Architects Daughter for sub-headers/titles/labels, Assistant for body/data — see the artifact for the reasoning.)

**Do not use these fonts, for any role, now or later** — Inter, Roboto, Arial, Instrument Serif, Fraunces, Playfair Display, Geist, Space Grotesk, Bricolage Grotesque, Instrument Sans, JetBrains Mono, Space Mono. This is a standing rule, not a one-time pick: every one of these is either a generic system default or has become the current "AI-generated site" tell. Check any future font choice against this list before using it.

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
