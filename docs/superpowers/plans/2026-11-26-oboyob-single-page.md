# Oboyob single-page home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the home page into the approved single-page design: a hero with a background photograph and a scrollable foreground strip, a "What we make" showcase of six garments, Instrument Serif for English headlines, and no empty bands.

**Architecture:** Plain React components under `frontend/src/components/home/`, styled by the existing `frontend/src/index.css` (Tailwind import plus the page's own classes). The hero strip uses native CSS scroll-snap. No new dependencies.

**Tech Stack:** React 19, Vite 8, Tailwind 4 (import only), Vitest 5 with Testing Library, plain CSS, Google Fonts (Instrument Serif), Unsplash images under the Unsplash License.

**Spec:** `docs/superpowers/specs/2026-11-26-oboyob-single-page-design.md`

## Global Constraints

- Site copy is English only. No Bengali text except the wordmark (`Logo.jsx`).
- The Bengali wordmark keeps its brand face (Anek Bangla / Tiro Bangla). Do not change `Logo.jsx`.
- Headlines in English use `Instrument Serif`. Body text keeps the brand body face (Hind Siliguri).
- Photographs: free Unsplash only. Every image URL starts with `https://images.unsplash.com/photo-`. Reject any `plus.unsplash.com` URL.
- Every photographer is credited in the footer's `<details className="credits">`.
- No new dependencies in `frontend/package.json`.
- Every section fills its space. Do not force a section to a viewport height.
- sloplint: `node "C:/Users/LENOVO/.claude/skills/hallmark/scripts/sloplint.mjs" <files> --genre editorial` must report 0 FAIL.

## Review Focus

1. A visitor with a slow connection sees the hero text before the photographs load. Test: `Hero` renders its `h1` and button with no image loaded.
2. Keyboard users can reach every strip item and the showcase links. Test: each strip item is focusable, or contains a focusable element.
3. A photograph with a missing file must not break layout. Test: every `<img>` has a non-empty `alt`.
4. The Bengali wordmark must not be replaced by English text. Test: `HomeNav` still renders the element with `aria-label="অবয়ব"`.
5. Reduced-motion users get no scroll animation. Test: the strip uses no transition on scroll.

---

### Task 1: Load Instrument Serif and apply it to English headlines

**Files:**
- Modify: `frontend/index.html` (add the Google Fonts `<link>` in `<head>`)
- Modify: `frontend/src/index.css` (add token and apply it)
- Test: `frontend/src/components/home/fonts.test.jsx` (create)

**Interfaces:**
- Consumes: none
- Produces: CSS custom property `--font-display-latin: "Instrument Serif", serif;` on `:root`. Every English headline class listed in Step 3 uses `font-family: var(--font-display-latin)`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/home/fonts.test.jsx`:

```jsx
import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../../index.css"), "utf8");
const html = readFileSync(resolve(__dirname, "../../../index.html"), "utf8");

describe("display font", () => {
  test("Instrument Serif is loaded from Google Fonts", () => {
    expect(html).toContain("family=Instrument+Serif");
  });

  test("the Latin display token is declared", () => {
    expect(css).toContain('--font-display-latin: "Instrument Serif", serif;');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/home/fonts.test.jsx`
Expected: FAIL, both assertions fail (the link and the token are not present yet).

- [ ] **Step 3: Implement**

In `frontend/index.html` `<head>`, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
```

In `frontend/src/index.css`, add inside the `:root` block of `brand-tokens.css` is NOT the file; add to `index.css` at the end:

```css
:root { --font-display-latin: "Instrument Serif", serif; }
.hero-title, .process-title, .how-title, .approach-item h3, .how-item h3, .garment-card h3, .home-showcase h3, .section h2 {
  font-family: var(--font-display-latin);
}
```

Note: `.section h2` applies only to English section headings. The Bengali wordmark is a `span` inside `Logo.jsx` and is not affected.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/home/fonts.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/src/index.css frontend/src/components/home/fonts.test.jsx
git commit -m "feat(frontend): load Instrument Serif for English headlines"
```

---

### Task 2: Hero with a background photograph and a scrollable foreground strip

**Files:**
- Modify: `frontend/src/components/home/Hero.jsx`
- Modify: `frontend/src/index.css` (append `.hero-bg`, `.hero-strip` rules)
- Test: `frontend/src/components/home/Hero.test.jsx` (replace contents)

**Interfaces:**
- Consumes: Task 1 font token.
- Produces: `Hero({ onLetsGo })` renders `section.hero` with a `div.hero-bg` (background `<img>`), the `h1#hero-h`, the lead paragraph, the primary button, and `ul.hero-strip` containing five `li` items. Each item is `<figure className="hero-strip__item"><img .../><figcaption>` — figcaption text is the label.

- [ ] **Step 1: Write the failing test**

Replace `frontend/src/components/home/Hero.test.jsx` with:

```jsx
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero.jsx";

function renderHero(props = {}) {
  return render(<MemoryRouter><Hero onLetsGo={() => {}} {...props} /></MemoryRouter>);
}

describe("Hero", () => {
  test("renders the headline and the lead", () => {
    renderHero();
    expect(screen.getByRole("heading", { name: /custom tailoring, made to your measure/i })).toBeInTheDocument();
    expect(screen.getByText(/the fabric, the fit and the finish/i)).toBeInTheDocument();
  });

  test("renders a background image and a strip of five items", () => {
    const { container } = renderHero();
    expect(container.querySelector(".hero-bg img")).not.toBeNull();
    expect(container.querySelectorAll(".hero-strip__item")).toHaveLength(5);
  });

  test("every image has alt text", () => {
    const { container } = renderHero();
    container.querySelectorAll("img").forEach((img) => {
      expect(img.getAttribute("alt")).toBeTruthy();
    });
  });

  test("primary CTA calls onLetsGo", () => {
    const onLetsGo = vi.fn();
    renderHero({ onLetsGo });
    fireEvent.click(screen.getByRole("button", { name: /book a consultation/i }));
    expect(onLetsGo).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/home/Hero.test.jsx`
Expected: FAIL on the background and strip assertions.

- [ ] **Step 3: Implement**

Replace `frontend/src/components/home/Hero.jsx` with:

```jsx
const STRIP = [
  { src: "/assets/photos/hero-suit-cuff.jpg", alt: "A man buttoning a dark blue suit jacket", label: "Double-breasted suit" },
  { src: "/assets/photos/approaches-fabric-swatches.jpg", alt: "Wool suit-fabric swatches on a tailor's table", label: "Fabric, chosen in person" },
  { src: "/assets/photos/process-measure.jpg", alt: "A hand holding a measuring tape", label: "Measured twice" },
  { src: "/assets/photos/process-stitch.jpg", alt: "A sewing machine at work", label: "Stitched by hand" },
  { src: "/assets/photos/process-finish.jpg", alt: "Hands finishing a seam", label: "Finished for you" },
];

export default function Hero({ onLetsGo }) {
  return (
    <section className="hero hero--bg" data-enter aria-labelledby="hero-h">
      <div className="hero-bg">
        <img src={STRIP[0].src} alt={STRIP[0].alt} fetchPriority="high" />
      </div>
      <div className="wrap hero-body">
        <h1 id="hero-h" className="hero-title">Custom tailoring, made to your measure</h1>
        <p className="t-lead">We guide the fabric, the fit and the finish in person.</p>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={onLetsGo}>
            Book a consultation
          </button>
          <a className="btn btn--secondary" href="#how-it-works">See how it works</a>
        </div>
      </div>
      <ul className="hero-strip" aria-label="Recent work">
        {STRIP.map((item) => (
          <li key={item.src} className="hero-strip__item">
            <figure>
              <img src={item.src} alt={item.alt} loading="lazy" />
              <figcaption>{item.label}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Note: the background image reuses the first strip item's `alt`, so the "every image has alt text" test passes with no `aria-hidden` exception.

In `frontend/src/index.css` append:

```css
.hero--bg { position: relative; min-height: 100svh; overflow: hidden; }
.hero-bg { position: absolute; inset: 0; z-index: 0; }
.hero-bg img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) brightness(0.45); }
.hero-body { position: relative; z-index: 1; padding-top: 18vh; }
.hero-strip {
  position: relative; z-index: 1; list-style: none; margin: 0; padding: 0 0 48px 24px;
  display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory;
  width: 66vw; margin-top: 8vh;
}
.hero-strip__item { flex: 0 0 min(34vw, 420px); scroll-snap-align: start; }
.hero-strip__item img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; display: block; }
.hero-strip__item figcaption { margin-top: 8px; font-size: 14px; }
@media (max-width: 639px) { .hero-strip { width: 100%; } .hero-strip__item { flex-basis: 72vw; } }
@media (prefers-reduced-motion: reduce) { .hero-strip { scroll-behavior: auto; } }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/home/Hero.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/home/Hero.jsx frontend/src/components/home/Hero.test.jsx frontend/src/index.css
git commit -m "feat(frontend): hero with background photograph and scrollable strip"
```

---

### Task 3: Confirm the "On fit" label is removed

**Files:**
- Modify: `frontend/src/components/home/FitStatement.jsx` (only if the label is still present)
- Test: `frontend/src/components/home/FitStatement.test.jsx` (create)

**Interfaces:**
- Consumes: none
- Produces: `FitStatement()` renders no visible "On fit" label. Its `section` keeps `aria-label="On fit"`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/home/FitStatement.test.jsx`:

```jsx
import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import FitStatement from "./FitStatement.jsx";

describe("FitStatement", () => {
  test("shows no visible On fit label", () => {
    const { container } = render(<FitStatement />);
    expect(container.querySelector(".t-label")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `cd frontend && npx vitest run src/components/home/FitStatement.test.jsx`
Expected: PASS if the label was already removed. If it FAILS, go to Step 3.

- [ ] **Step 3: Implement (only if Step 2 failed)**

In `frontend/src/components/home/FitStatement.jsx`, delete the line `<p className="t-label">On fit</p>`. Keep the `section` and its `aria-label="On fit"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/home/FitStatement.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/home/FitStatement.jsx frontend/src/components/home/FitStatement.test.jsx
git commit -m "test(frontend): fit statement shows no visible label"
```

---

### Task 4: Replace "What we make" with the six-garment showcase

**Files:**
- Create: `frontend/src/components/home/Showcase.jsx`
- Create: `frontend/src/components/home/Showcase.test.jsx`
- Delete: `frontend/src/components/home/Garments.jsx`, `frontend/src/components/home/Garments.test.jsx`
- Modify: `frontend/src/pages/HomePage.jsx` (replace `Garments` with `Showcase`)
- Modify: `frontend/src/index.css` (append `.home-showcase` rules)

**Interfaces:**
- Consumes: Task 1 font token (`.home-showcase h3`).
- Produces: `Showcase()` renders `section#what-we-make` with `h2` "What we make" and an `ol.showcase-grid` of six `li.showcase-item`. Each item has `img` (Task 5 files), `h3` (style name), and `p` (one line).

The six entries, in this order (exact copy):

| # | h3 | p | photo file |
|---|---|---|---|
| 1 | Italian suit | Soft shoulders and a natural waist, cut in Naples style. | `/assets/photos/showcase-italian-suit.jpg` |
| 2 | Double-breasted suit | Two rows of buttons and a wider lapel, for occasions. | `/assets/photos/showcase-double-breasted.jpg` |
| 3 | Bootcut trousers | A gentle flare below the knee, over a clean shoe. | `/assets/photos/showcase-bootcut.jpg` |
| 4 | Straight-fit trousers | A clean line from hip to hem, for daily wear. | `/assets/photos/showcase-straight.jpg` |
| 5 | Formal shirt | A stiff collar and a fitted body, for work and events. | `/assets/photos/showcase-formal-shirt.jpg` |
| 6 | Cuban shirt | A relaxed open collar and a boxy cut, for warm days. | `/assets/photos/showcase-cuban-shirt.jpg` |

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/home/Showcase.test.jsx`:

```jsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Showcase from "./Showcase.jsx";

describe("Showcase", () => {
  test("names the section What we make", () => {
    render(<Showcase />);
    expect(screen.getByRole("heading", { level: 2, name: "What we make" })).toBeInTheDocument();
  });

  test("lists the six garments in order", () => {
    render(<Showcase />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Italian suit",
      "Double-breasted suit",
      "Bootcut trousers",
      "Straight-fit trousers",
      "Formal shirt",
      "Cuban shirt",
    ]);
  });

  test("every garment image has alt text", () => {
    const { container } = render(<Showcase />);
    expect(container.querySelectorAll(".showcase-item img")).toHaveLength(6);
    container.querySelectorAll(".showcase-item img").forEach((img) => {
      expect(img.getAttribute("alt")).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/home/Showcase.test.jsx`
Expected: FAIL (module `./Showcase.jsx` not found).

- [ ] **Step 3: Implement**

Create `frontend/src/components/home/Showcase.jsx`:

```jsx
const ITEMS = [
  { name: "Italian suit", note: "Soft shoulders and a natural waist, cut in Naples style.", src: "/assets/photos/showcase-italian-suit.jpg", alt: "A navy Italian-cut suit on a hanger" },
  { name: "Double-breasted suit", note: "Two rows of buttons and a wider lapel, for occasions.", src: "/assets/photos/showcase-double-breasted.jpg", alt: "A double-breasted suit jacket, buttoned" },
  { name: "Bootcut trousers", note: "A gentle flare below the knee, over a clean shoe.", src: "/assets/photos/showcase-bootcut.jpg", alt: "Bootcut trousers with a gentle flare" },
  { name: "Straight-fit trousers", note: "A clean line from hip to hem, for daily wear.", src: "/assets/photos/showcase-straight.jpg", alt: "Straight-fit trousers with a clean line" },
  { name: "Formal shirt", note: "A stiff collar and a fitted body, for work and events.", src: "/assets/photos/showcase-formal-shirt.jpg", alt: "A white formal shirt with a stiff collar" },
  { name: "Cuban shirt", note: "A relaxed open collar and a boxy cut, for warm days.", src: "/assets/photos/showcase-cuban-shirt.jpg", alt: "A Cuban-collar shirt with a relaxed cut" },
];

export default function Showcase() {
  return (
    <section className="section home-showcase" id="what-we-make" aria-labelledby="what-we-make-h">
      <div className="wrap">
        <h2 id="what-we-make-h">What we make</h2>
        <ol className="showcase-grid">
          {ITEMS.map((item) => (
            <li key={item.name} className="showcase-item">
              <div className="frame frame--photo frame--portrait">
                <img className="frame__img" src={item.src} alt={item.alt} loading="lazy" />
              </div>
              <h3>{item.name}</h3>
              <p>{item.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

In `frontend/src/pages/HomePage.jsx`: replace the import line `import Garments from "../components/home/Garments.jsx";` with `import Showcase from "../components/home/Showcase.jsx";`, and replace `<Garments />` with `<Showcase />`.

Delete the two Garments files with `git rm frontend/src/components/home/Garments.jsx frontend/src/components/home/Garments.test.jsx`.

In `frontend/src/index.css` append:

```css
.showcase-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px 24px; }
.showcase-item:nth-child(even) { margin-top: 56px; }
.showcase-item h3 { font-size: clamp(24px, 2.2vw, 32px); margin: 16px 0 6px; }
.showcase-item p { margin: 0; max-width: 40ch; }
@media (max-width: 1023px) { .showcase-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .showcase-item:nth-child(even) { margin-top: 0; } }
@media (max-width: 639px) { .showcase-grid { grid-template-columns: minmax(0, 1fr); } }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/home/Showcase.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/home/Showcase.jsx frontend/src/components/home/Showcase.test.jsx frontend/src/pages/HomePage.jsx frontend/src/index.css
git commit -m "feat(frontend): what-we-make showcase of six garments"
```

---

### Task 5: Source the six showcase photographs

**Files:**
- Create: `frontend/public/assets/photos/showcase-italian-suit.jpg`, `showcase-double-breasted.jpg`, `showcase-bootcut.jpg`, `showcase-straight.jpg`, `showcase-formal-shirt.jpg`, `showcase-cuban-shirt.jpg`
- Modify: `frontend/src/components/home/Footer.jsx` (credits)

**Interfaces:**
- Consumes: Task 4 file paths.
- Produces: six JPEG files at the paths in the Task 4 table. Footer credits name each photographer.

- [ ] **Step 1: Search and record candidates**

For each garment, open `https://unsplash.com/s/photos/<term>` with the browser and extract `img` sources with `javascript_tool`, keeping only `images.unsplash.com/photo-*` URLs whose `alt` names the garment. Use these search terms in order: `italian suit`, `double breasted suit`, `bootcut trousers`, `straight fit trousers`, `formal shirt`, `cuban shirt`. If a term returns no usable photo (no free image, no face, no readable brand), set that item to type-only: remove its `img` from the Task 4 markup and leave `h3` and `p`.

Expected: a list of six chosen `photo-` IDs, or a note that an item is type-only, written into the commit message.

- [ ] **Step 2: Download the chosen images**

For each chosen ID `photo-XXXX`, run:

```bash
curl -sL "https://images.unsplash.com/photo-XXXX?w=1600&q=70&fm=jpg&auto=format&fit=crop" -o frontend/public/assets/photos/showcase-<slug>.jpg
```

Expected: each file is over 50 KB (`ls -la` shows the size).

- [ ] **Step 3: Add credits to the footer**

In `frontend/src/components/home/Footer.jsx`, replace the `<summary>` and `<p>` inside `<details className="credits">` with the names of the photographers of all photographs on the page, in the form `Photographs: <name>, <name>, ... via Unsplash`. Keep the Unsplash License sentence.

- [ ] **Step 4: Verify in the browser**

Run: `cd frontend && npm run dev` (leave running), then open `http://localhost:5173/` and confirm each showcase image loads (no broken image). Expected: six images or the type-only items, no broken images.

- [ ] **Step 5: Commit**

```bash
git add frontend/public/assets/photos frontend/src/components/home/Footer.jsx
git commit -m "feat(frontend): showcase photographs and credits"
```

---

### Task 6: Full verification

**Files:** none modified unless a check fails.

- [ ] **Step 1: Run the test suite**

Run: `cd frontend && npx vitest run`
Expected: all test files pass.

- [ ] **Step 2: Run sloplint**

Run: `node "C:/Users/LENOVO/.claude/skills/hallmark/scripts/sloplint.mjs" frontend/src/index.css frontend/src/components/home/*.jsx --genre editorial`
Expected: `0 FAIL`. Fix any FAIL and re-run.

- [ ] **Step 3: Check layout at 1440 and 390**

With the dev server running, check at 1440 px wide and 390 px wide:
- The hero headline, lead and primary button are visible without scrolling at 1280x800.
- No section is taller than its content (no empty bands).
- The strip scrolls sideways (set `scrollLeft` on `.hero-strip`, read it back).

Expected: all three hold at both widths. Record the result in the commit message of Step 4.

- [ ] **Step 4: Commit and push**

```bash
git push origin Dev_exp
```

---

## Self-Review

- Spec coverage: hero (Task 2), Instrument Serif (Task 1), showcase of six garments (Task 4), process and footer kept (unchanged), "On fit" label removed (Task 3), photographs and credits (Task 5), tests and sloplint (Task 6), 1440 and 390 checks (Task 6). Covered.
- Type consistency: `Hero`, `Showcase`, `FitStatement` take the same props as before; `HomePage` imports `Showcase` and no longer `Garments`.
- Open items: the photograph search results are not known until Task 5 runs. Task 5 has an explicit type-only fallback, so no task is blocked.
