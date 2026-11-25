// Bridges design-taste-frontend's diagram/moment widgets into a Vite/React
// app: a plain public-folder script (not pulled into Vite's module graph,
// which refuses to `import` a /public file from src/) that exposes two
// global functions React components call from their own useLayoutEffect,
// right after each one commits — the precise moment its [data-diagram] or
// [data-moment] element exists, no polling or MutationObserver needed.
import dg from "/assets/diagrams/diagram.js";
import moments from "/assets/moments/moments.js";

// dg.auto() scans the whole document and is not idempotent per element (a
// successful mount replaces an element's inline <script type="application/
// json"> with the rendered diagram, so a second call on the same element
// finds no spec and logs an error). Mount each element directly instead,
// exactly once, using dg.mount() with the spec read the same way dg.auto()
// reads it.
const seenDiagrams = new WeakSet();

// Both widgets measure text (node-tile width, line wrapping) to lay
// themselves out. Mounting before the page's custom webfonts (Hind
// Siliguri, Tiro Bangla) have swapped in measures the fallback font
// instead, so the real font then lands at different widths with nothing
// re-measuring — cut-off captions, and in the diagram's case a stale SVG
// viewBox. Wait for fonts to be ready first.
const fontsReady = typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve();

window.__mountDiagram = async (el) => {
  if (!el || seenDiagrams.has(el)) return;
  seenDiagrams.add(el);
  const inline = el.querySelector(':scope > script[type="application/json"]');
  if (!inline) return;
  let spec;
  try {
    spec = JSON.parse(inline.textContent);
  } catch (err) {
    console.error("mount-widgets: bad diagram spec", el, err);
    return;
  }
  await fontsReady;
  dg.mount(el, spec);
};

// moments.js's own mount() is already idempotent per element (keeps the
// mount promise on the element itself), so this is safe to call freely.
window.__mountMoment = async (el) => {
  if (!el) return;
  await fontsReady;
  moments.mount(el);
};
