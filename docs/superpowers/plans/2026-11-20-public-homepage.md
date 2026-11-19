# Public Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give logged-out visitors a real public homepage at `/` (navbar + hero + how-it-works), built from the approved "scribbled-notebook" design artifact, instead of the current silent redirect straight to `/login`.

**Architecture:** A new `Home.jsx` route component owns the auth branch: logged-in users keep today's role redirect (`/orders` or `/admin/orders`), logged-out users render a new `HomePage.jsx` composed of `HomeNav` (desktop links + tape-measure mobile menu), `Hero` (headline/CTAs/illustration, ported near-verbatim from the artifact), and `HowItWorks` (new content, not in the artifact — kept deliberately plain). Design tokens (colors, three fonts) are declared once via Tailwind v4's `@theme` in `index.css`, scoped to classes the homepage opts into — no change to the existing global body font or any other page's styling.

**Tech Stack:** React 18 + Vite, Tailwind CSS v4 (CSS-first `@theme`, no JS config file), react-router-dom v6, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/handoffs/2026-11-18-frontend-design-criteria.md` (process + design criteria) and the approved artifact `project/Main.dc.html` at https://claude.ai/artifact/9SarwxYdYa1Ai6B7yD4H7Y, version `1795113929-43fb` (hero section + navbar + tape-measure menu — the only sections of that artifact that were explicitly approved as page content; the palette/typography/component boards in the same file are a spec sheet, not page content to port).

## Global Constraints

- Theme is "scribbled notebook" — paper background, ink text, royal-blue accent (`#203A8C`), warm-red urgent (`#C1502E`), marker-green success (`#3F6B3E`), highlighter yellow (`#F6D743`) used only for marker-highlight/sticky-note accents, never buttons or status.
- Fonts: Shantell Sans (`.hand` — headlines), Architects Daughter (`.title` — sub-headers/titles/labels), Assistant (body/data-dense). Never Inter, Roboto, Arial, Instrument Serif, Fraunces, Playfair Display, Geist, Space Grotesk, Bricolage Grotesque, Instrument Sans, JetBrains Mono, Space Mono.
- Hallmark Floor: every color/font through a token; no `transition: all`; never animate `width`/`height`/`top`/`left` (use `transform`/`opacity`); no purple-to-blue gradient, card-in-card, emoji-as-icon, icon-in-gradient-circle; no eyebrow/tracked-caps labels; no invented metric, testimonial, logo wall, or case-study count; every interactive element has a visible `:focus-visible` state; every animation has a `prefers-reduced-motion` fallback; hero headline + one sentence + primary action visible at 1280×800 without scrolling.
- Lightweight = browser/render performance, not reduced decoration (user's explicit correction) — plain CSS/SVG only, no images, no JS animation libraries, no heavy filters.
- Nothing merges to `main` unless its own tests are green (project auto-merge rule).

## Review Focus

- A screen reader / keyboard-only user hitting the mobile tape-measure menu: the toggle must be a real `<button>` with `aria-expanded` and `aria-controls`, reachable and operable by keyboard alone (Task 3).
- A user with `prefers-reduced-motion` opening the mobile menu: the unroll must not animate motion-triggering properties when that's set (Task 3).
- A logged-in admin or customer who still has a token and navigates to `/`: must land on their existing dashboard, never see the marketing page (Task 2).
- A visitor on a narrow (375px) viewport: hero headline/CTA must not overflow or get clipped by the fixed illustration/sticky-note layout (Task 4, verified in Task 6).
- A user who clicks "See how it works" before JS fully settles, or shares the `#how-it-works` link directly: the anchor target must exist and be reachable without relying on the nav's own state (Task 5).

---

## Task 1: Design tokens and fonts

**Files:**
- Modify: `frontend/index.html` — add Google Fonts `<link>`s for Shantell Sans, Architects Daughter, Assistant (preconnect + stylesheet, same URL pattern as the artifact).
- Modify: `frontend/src/index.css` — add an `@theme` block declaring color tokens (`--color-ink: #2B2A28`, `--color-paper: #FAF6ED`, `--color-accent: #203A8C`, `--color-urgent: #C1502E`, `--color-success: #3F6B3E`, `--color-highlighter: #F6D743`) and font tokens (`--font-hand: 'Shantell Sans', cursive`, `--font-title: 'Architects Daughter', cursive`, `--font-home-body: 'Assistant', system-ui, sans-serif`). Do not touch the existing `html { color-scheme; background-color }` rule or any existing token — this is additive only, and no other page references these new tokens yet.

**Interfaces:**
- Produces: Tailwind utility classes `bg-paper`, `text-ink`, `bg-accent`, `text-accent`, `bg-urgent`, `text-urgent`, `bg-success`, `text-success`, `bg-highlighter`, `font-hand`, `font-title`, `font-home-body` — consumed by Tasks 3-5.

- [ ] **Step 1: Add the font `<link>` tags to `frontend/index.html`** inside `<head>`, after the existing `<meta viewport>` tag: two `<link rel="preconnect">` (fonts.googleapis.com, fonts.gstatic.com with `crossorigin`) and one `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght@400..800&family=Architects+Daughter&family=Assistant:wght@400;500;600;700&display=swap">`.
- [ ] **Step 2: Add the `@theme` block to `frontend/src/index.css`**, after the `@import "tailwindcss";` line and before the existing `html { ... }` rule, with the six color tokens and three font tokens listed above.
- [ ] **Step 3: Run the existing suite to confirm nothing broke**

Run: `cd frontend && npx vitest run`
Expected: PASS, same 7 files / 21 tests as the pre-change baseline.

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/src/index.css
git commit -m "feat(frontend): add scribbled-notebook design tokens and fonts"
```

---

## Task 2: Public `/` route

**Files:**
- Create: `frontend/src/pages/Home.jsx` — the route-level component for `/`. Branches on `useAuth().token`: if present, redirects by role (moves the existing logic out of `App.jsx`'s inline `Home()`); if absent, renders `<HomePage />` (Task 6 creates this; stub it as `<div>homepage placeholder</div>` for this task and replace the import in Task 6).
- Modify: `frontend/src/app/App.jsx` — delete the inline `Home()` function; import `Home` from `../pages/Home.jsx`; change the `/` route to render `<Home />` directly, with **no `<ProtectedRoute>` wrapper** (Home.jsx now owns both branches).
- Test: `frontend/src/pages/Home.test.jsx`

**Interfaces:**
- Consumes: `useAuth()` from `../app/AuthContext.jsx` (existing: `{ user, token }`).
- Produces: `Home` default export, a component with no props, used by `App.jsx`'s `/` route.

- [ ] **Step 1: Write the failing tests**

```jsx
// frontend/src/pages/Home.test.jsx
import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import Home from "./Home.jsx";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/orders" element={<div>my orders</div>} />
          <Route path="/admin/orders" element={<div>admin board</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders the public homepage for a logged-out visitor", () => {
    renderHome();
    expect(screen.getByText(/homepage placeholder/i)).toBeInTheDocument();
  });

  test("redirects a logged-in customer to /orders", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));
    renderHome();
    expect(screen.getByText("my orders")).toBeInTheDocument();
  });

  test("redirects a logged-in admin to /admin/orders", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "admin" }));
    renderHome();
    expect(screen.getByText("admin board")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/Home.test.jsx`
Expected: FAIL (`Home.jsx` does not exist yet).

- [ ] **Step 3: Implement `Home.jsx`** — a default-exported function component with the branch described above (role redirect ported verbatim from the current `App.jsx` `Home()`; the `!token` branch renders `<div>homepage placeholder</div>` for now).

- [ ] **Step 4: Update `App.jsx`** — remove the inline `Home()` function and its now-unused `Navigate`/`useAuth` usage if nothing else in the file needs them, import `Home` from `../pages/Home.jsx`, and change the `/` route to:

```jsx
<Route path="/" element={<Home />} />
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run`
Expected: PASS, including the 3 new tests (24 total) — confirms the route change didn't regress `ProtectedRoute.test.jsx` or any other suite.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Home.jsx frontend/src/pages/Home.test.jsx frontend/src/app/App.jsx
git commit -m "feat(frontend): make / a public route, extract role-redirect into Home.jsx"
```

---

## Task 3: `HomeNav` (desktop links + tape-measure mobile menu)

**Content decision (deviation from the artifact, needed before this task starts):** the artifact's hero mockup shows the *authenticated* in-app nav links ("My orders" / "New order" / "Measurements") as a stand-in to demonstrate the visual system on a real link set — this page is for anonymous visitors, who cannot see those. Swap the link content to: brand mark "TailorTrack" (`.hand`, links to `/`), "How it works" (anchor `href="#how-it-works"`), "Log in" (`Link` to `/login`). The primary CTA stays in the Hero (Task 4), not the nav. Visual system (ruler-tick baseline, measurement-dropped links, tape-measure mobile menu) is ported as designed.

**Files:**
- Create: `frontend/src/components/home/HomeNav.jsx`
- Test: `frontend/src/components/home/HomeNav.test.jsx`

**Interfaces:**
- Produces: `HomeNav` default export, no props, consumed by `HomePage.jsx` (Task 6).

- [ ] **Step 1: Write the failing tests**

```jsx
// frontend/src/components/home/HomeNav.test.jsx
import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomeNav from "./HomeNav.jsx";

function renderNav() {
  return render(<MemoryRouter><HomeNav /></MemoryRouter>);
}

describe("HomeNav", () => {
  test("shows the brand mark and desktop links", () => {
    renderNav();
    expect(screen.getByText("TailorTrack")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute("href", "#how-it-works");
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  test("mobile menu toggle starts collapsed and exposes aria-expanded/aria-controls", () => {
    renderNav();
    const toggle = screen.getByRole("button", { name: /menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls");
  });

  test("clicking the toggle expands the mobile menu", () => {
    renderNav();
    const toggle = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const controlsId = toggle.getAttribute("aria-controls");
    expect(document.getElementById(controlsId)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/components/home/HomeNav.test.jsx`
Expected: FAIL (`HomeNav.jsx` does not exist yet).

- [ ] **Step 3: Implement `HomeNav.jsx`.** Desktop: brand mark + the three links above, each dropped from a short vertical tick (ported from the artifact's `<span style="width:1.5px;height:8px;...">` pattern as a Tailwind-styled `<span>` under each link). Mobile: a real `<button type="button" aria-expanded={open} aria-controls="home-mobile-menu">Menu</button>` rendering the collapsed tape-measure-case SVG icon when closed; toggling renders the expanded tape-measure SVG (ported from the artifact) inside `<div id="home-mobile-menu">` containing the same three links as plain measured points. The expand/collapse transition animates only `transform` (`scaleX` from a left `transform-origin`) and `opacity`, wrapped in `@media (prefers-reduced-motion: reduce) { transition: none; }`. All colors/fonts use Task 1's tokens (`text-ink`, `font-hand`, `font-title`, `border-ink`, etc.) — no literal hex in this file.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/components/home/HomeNav.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/home/HomeNav.jsx frontend/src/components/home/HomeNav.test.jsx
git commit -m "feat(frontend): add HomeNav with tape-measure mobile menu"
```

---

## Task 4: `Hero`

**Files:**
- Create: `frontend/src/components/home/Hero.jsx`
- Test: `frontend/src/components/home/Hero.test.jsx`

**Interfaces:**
- Produces: `Hero` default export, no props, consumed by `HomePage.jsx` (Task 6).

- [ ] **Step 1: Write the failing tests**

```jsx
// frontend/src/components/home/Hero.test.jsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero.jsx";

function renderHero() {
  return render(<MemoryRouter><Hero /></MemoryRouter>);
}

describe("Hero", () => {
  test("renders the headline and subcopy", () => {
    renderHero();
    expect(screen.getByText(/you imagine it\. we tailor it/i)).toBeInTheDocument();
    expect(screen.getByText(/measurements, orders, and fittings/i)).toBeInTheDocument();
  });

  test("primary CTA goes to /signup", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /let's go/i })).toHaveAttribute("href", "/signup");
  });

  test("secondary CTA points at the how-it-works anchor", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /see how it works/i })).toHaveAttribute("href", "#how-it-works");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/components/home/Hero.test.jsx`
Expected: FAIL (`Hero.jsx` does not exist yet).

- [ ] **Step 3: Implement `Hero.jsx`.** Port near-verbatim from the artifact's hero section (lines 190-254 of `Main.dc.html`): headline with the highlighter-marker "real" treatment, subcopy, the "Let's go" button as a `Link to="/signup"` and "See how it works" as an `<a href="#how-it-works">`, both styled with the measurement-box corner brackets and crayon-mottled fill from the artifact, both with a visible `:focus-visible` ring. Keep the garment/tape-measure/needle-thread SVG illustration and the two stacked sticky notes as static decorative content (they're illustrative UI chrome showing example order cards, not a claimed business metric or testimonial). All colors/fonts via Task 1's tokens; no literal hex.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/components/home/Hero.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/home/Hero.jsx frontend/src/components/home/Hero.test.jsx
git commit -m "feat(frontend): add Hero section ported from the approved design"
```

---

## Task 5: `HowItWorks`

**Not in the artifact — new content.** Kept deliberately plain (same type system and measurement-box card language, no new illustration, no sketchy rotation) since it wasn't run through the brainstorming/hallmark approval cycle the hero was: a restrained treatment is the safer default per the "admin screens stay calmer" precedent already in the design doc. Four steps built from real backend features only (`backend/controllers`: measurements, orders, SSLCommerz payment, order status) — no invented counts, no testimonials.

**Files:**
- Create: `frontend/src/components/home/HowItWorks.jsx`
- Test: `frontend/src/components/home/HowItWorks.test.jsx`

**Interfaces:**
- Produces: `HowItWorks` default export, no props, renders a `<section id="how-it-works">`, consumed by `HomePage.jsx` (Task 6).

- [ ] **Step 1: Write the failing tests**

```jsx
// frontend/src/components/home/HowItWorks.test.jsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HowItWorks from "./HowItWorks.jsx";

describe("HowItWorks", () => {
  test("exposes the #how-it-works anchor target", () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector("#how-it-works")).toBeInTheDocument();
  });

  test("lists the four real steps", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/measurements/i)).toBeInTheDocument();
    expect(screen.getByText(/place.*order|order.*place/i)).toBeInTheDocument();
    expect(screen.getByText(/pay|advance/i)).toBeInTheDocument();
    expect(screen.getByText(/track|pickup|status/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/components/home/HowItWorks.test.jsx`
Expected: FAIL (`HowItWorks.jsx` does not exist yet).

- [ ] **Step 3: Implement `HowItWorks.jsx`** — `<section id="how-it-works">` with a heading and four numbered cards (measurement-box border treatment, no rotation/highlighter), one per real feature: "Save your measurements", "Place an order", "Pay the advance" (SSLCommerz), "Track it to pickup". Tokens from Task 1 only.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/components/home/HowItWorks.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/home/HowItWorks.jsx frontend/src/components/home/HowItWorks.test.jsx
git commit -m "feat(frontend): add HowItWorks section"
```

---

## Task 6: Assemble `HomePage` and wire it into `Home.jsx`

**Files:**
- Create: `frontend/src/pages/HomePage.jsx` — composes `HomeNav` + `Hero` + `HowItWorks` inside the paper-background wrapper (the artifact's gradient-wash `body` background, applied here as a scoped wrapper `div` class, not the global `body`).
- Modify: `frontend/src/pages/Home.jsx` — replace the `<div>homepage placeholder</div>` stub with `<HomePage />`.
- Test: `frontend/src/pages/HomePage.test.jsx`

**Interfaces:**
- Consumes: `HomeNav` (Task 3), `Hero` (Task 4), `HowItWorks` (Task 5).
- Produces: `HomePage` default export, no props.

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/pages/HomePage.test.jsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage.jsx";

test("HomePage renders nav, hero, and how-it-works together", () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  expect(screen.getByText(/you imagine it\. we tailor it/i)).toBeInTheDocument();
  expect(screen.getByText(/how-it-works|how it works/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/HomePage.test.jsx`
Expected: FAIL (`HomePage.jsx` does not exist yet).

- [ ] **Step 3: Implement `HomePage.jsx`** and update `Home.jsx`'s `!token` branch to render it.

- [ ] **Step 4: Run the full suite to verify everything passes**

Run: `cd frontend && npx vitest run`
Expected: PASS, all tests from Tasks 1-6 plus the pre-existing baseline green.

- [ ] **Step 5: Verify in the browser** — `preview_start` the frontend dev server, navigate to `/` logged out, confirm headline + subcopy + "Let's go" are visible at 1280×800 without scrolling (`resize_window`), click the mobile menu toggle at a narrow width and confirm it expands, click "See how it works" and confirm it scrolls to the section, click "Let's go" and confirm it navigates to `/signup`, click "Log in" and confirm it navigates to `/login`. Then log in and reload `/` to confirm the role redirect still fires.

- [ ] **Step 6: Run hallmark's sloplint against the rendered homepage**

Run: `node "C:\Users\LENOVO\.claude\skills\hallmark\scripts\sloplint.mjs" <rendered-homepage-output> --render`
Expected: every FAIL fixed, every REFLEX fixed or explicitly waived with a one-line reason.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/HomePage.jsx frontend/src/pages/HomePage.test.jsx frontend/src/pages/Home.jsx
git commit -m "feat(frontend): assemble public homepage from nav, hero, and how-it-works"
```

---

## Self-review

1. **Spec coverage:** Doc's mandatory process → followed per-task (brainstorming/hallmark already done for nav+hero via the artifact iterations; `unit-testing-test-generate` + TDD per task below; ponytail scope on all code steps; verification in Task 6; code review is the human gate after this plan, not a task here). Design criteria (theme, palette, typography, font exclusion list, component look, interaction states, reusability) → Task 1 (tokens/fonts), Tasks 3-5 (component look, reusable homepage-only components), focus-visible states called out in Tasks 3-4. "Lightweight" correction → Global Constraints, enforced by "no JS animation / no images" constraint on every component task.
2. **Step scan:** each step is one action with one checkable result; no step left as "handle appropriately."
3. **Type consistency:** `Home` (route decision) vs `HomePage` (marketing content) names are used consistently from Task 2 through Task 6 — not interchanged.
4. **Review Focus:** all five lines have an owning task's test (keyboard/aria → Task 3; reduced-motion → Task 3; logged-in redirect → Task 2; narrow viewport → Task 6 browser check; direct anchor link → Task 5's anchor-presence test).
5. **Proportion:** six small tasks porting one already-approved section plus one small new section; no task body transcribes code the signature/test don't already determine.
