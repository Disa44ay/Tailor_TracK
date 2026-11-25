import { useMemo } from "react";
import paijamaShort from "./assets/paijama-short.webp";
import paijamaCasual from "./assets/paijama-casual.webp";
import { supportsCssMask } from "./ShirtSketch.jsx";

// Placeholder art: image-generation quota was still exhausted (same
// account-wide daily cap Tasks 5-7 hit) when this task's confirmation
// attempt ran, so these reuse PantSketch's existing assets rather than
// dedicated paijama silhouettes — paijama is itself a trouser garment, so
// PantSketch's slim/baggy silhouettes are the closest visual match
// available, closer than reaching into ShirtSketch/SuitSketch's
// torso-garment art. Replacing them with real art later only means
// swapping these two files, nothing else in this component changes.
// Because the art is a placeholder (not real paijama art), GarmentSketch.jsx
// does NOT wire this component into its live lookup yet — selecting paijama
// shows the generic "coming soon" placeholder instead. Wire it back in once
// real art replaces SHORT_ASSET/CASUAL_ASSET below.
const SHORT_ASSET = paijamaShort;
const CASUAL_ASSET = paijamaCasual;

// Paijama has exactly 2 fit options (short/casual — see fitOptionsByGarment.js)
// and, per plan.md §2, the difference between them is length/looseness (a
// discrete category), not width-ease. Like PanjabiSketch's regular/short,
// each gets its own single-state (non-crossfading) art entry, looked up
// directly by fitType — the same pattern as PantSketch's
// SLIM_STATES/RELAXED_STATES/BAGGY_STATES, not its REGULAR_STATES crossfade
// pair. fitValue is accepted (for interface consistency with the other
// sketch components, which all take it) but intentionally unused: there is
// no axis for it to move along here.
const ASSET_BY_FIT_TYPE = {
  short: SHORT_ASSET,
  casual: CASUAL_ASSET,
};

const PRINT_PATTERNS = {
  striped: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.3'/%3E%3C/svg%3E",
  checked: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.25'/%3E%3Crect width='16' height='7' fill='%232B2A28' opacity='0.25'/%3E%3C/svg%3E",
};

const CAN_MASK = supportsCssMask();

// fitValue is deliberately not destructured here: GarmentSketch forwards it
// (for interface consistency with ShirtSketch/PantSketch) but this component
// has no axis for it to move along — see ASSET_BY_FIT_TYPE comment above.
export default function PaijamaSketch({ fitType = "short", colorHex = "#D6D6D2", printPattern = "solid" }) {
  const src = ASSET_BY_FIT_TYPE[fitType] ?? SHORT_ASSET;
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
      aria-label={`Paijama sketch, ${fitType} fit, ${printPattern} fabric`}
    >
      <div data-testid="paijama-fit-layer-0" className="absolute inset-0">
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-contain" />
        {CAN_MASK && (
          <>
            <div
              data-testid="paijama-tint-layer"
              className="absolute inset-0"
              style={{ ...maskStyle, backgroundColor: colorHex, mixBlendMode: "multiply" }}
            />
            {printOverlay && (
              <div
                data-testid="paijama-print-layer"
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
