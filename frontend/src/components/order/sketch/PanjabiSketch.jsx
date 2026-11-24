import { useMemo } from "react";
import panjabiRegular from "./assets/panjabi-regular.webp";
import panjabiShort from "./assets/panjabi-short.webp";
import { supportsCssMask } from "./ShirtSketch.jsx";

// Placeholder art (see task-6-report.md): image-generation quota was already
// exhausted (same account-wide daily cap Task 5 hit) before this task got to
// generate anything, so these reuse ShirtSketch's existing assets rather than
// dedicated panjabi/kurta silhouettes. Replacing them with real art later only
// means swapping these two files, nothing else in this component changes.
const REGULAR_ASSET = panjabiRegular;
const SHORT_ASSET = panjabiShort;

// Panjabi has exactly 2 fit options (regular/short — see fitOptionsByGarment.js)
// and, per plan.md §2, the difference between them is garmentLength (a discrete
// hem-length category), not width-ease. Unlike PantSketch's "regular" (which
// genuinely sits between two drawn silhouettes on a width continuum and so
// crossfades on fitValue), panjabi's "regular" and "short" are each their own
// fully-resolved, independent length category with no in-between state to
// represent. So each gets its own single-state (non-crossfading) art entry,
// looked up directly by fitType — the same pattern as PantSketch's
// SLIM_STATES/RELAXED_STATES/BAGGY_STATES, not its REGULAR_STATES crossfade
// pair. fitValue is accepted (for interface consistency with the other sketch
// components, which all take it) but intentionally unused: there is no axis
// for it to move along here, and building one would reintroduce the exact bug
// class Task 5's fix rounds caught (treating a discrete per-fitType choice as
// if it were a continuum).
const ASSET_BY_FIT_TYPE = {
  regular: REGULAR_ASSET,
  short: SHORT_ASSET,
};

const PRINT_PATTERNS = {
  striped: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.3'/%3E%3C/svg%3E",
  checked: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.25'/%3E%3Crect width='16' height='7' fill='%232B2A28' opacity='0.25'/%3E%3C/svg%3E",
};

const CAN_MASK = supportsCssMask();

// eslint-disable-next-line no-unused-vars -- fitValue is accepted for interface
// consistency with ShirtSketch/PantSketch (GarmentSketch forwards all props
// unconditionally) but unused: see ASSET_BY_FIT_TYPE comment above.
export default function PanjabiSketch({ fitValue = 0, fitType = "regular", colorHex = "#D6D6D2", printPattern = "solid" }) {
  const src = ASSET_BY_FIT_TYPE[fitType] ?? REGULAR_ASSET;
  const printOverlay = useMemo(() => PRINT_PATTERNS[printPattern] ?? null, [printPattern]);

  const maskStyle = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  return (
    <div
      className="relative mx-auto aspect-[16/9] w-full max-w-xl"
      role="img"
      aria-label={`Panjabi sketch, ${fitType} fit, ${printPattern} fabric`}
    >
      <div data-testid="panjabi-fit-layer-0" className="absolute inset-0">
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-contain" />
        {CAN_MASK && (
          <>
            <div
              data-testid="panjabi-tint-layer"
              className="absolute inset-0"
              style={{ ...maskStyle, backgroundColor: colorHex, mixBlendMode: "multiply" }}
            />
            {printOverlay && (
              <div
                data-testid="panjabi-print-layer"
                className="absolute inset-0"
                style={{ ...maskStyle, backgroundImage: `url("${printOverlay}")`, mixBlendMode: "multiply" }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
