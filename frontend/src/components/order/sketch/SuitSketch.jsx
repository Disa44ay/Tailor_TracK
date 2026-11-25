import { useMemo } from "react";
import suitItalian from "./assets/suit-italian.webp";
import suitFormal from "./assets/suit-formal.webp";
import suitDoubleBreasted from "./assets/suit-double-breasted.webp";
import { crossfadeOpacities, supportsCssMask } from "./ShirtSketch.jsx";

// Placeholder art: image-generation quota was already exhausted account-wide
// by Tasks 5/6 before this task's own single confirmation attempt, so these
// reuse existing assets rather than dedicated suit silhouettes. Replacing
// them with real art later only means swapping these three files, nothing
// else in this component changes.
// Because the art is a placeholder (not real suit art — e.g. double_breasted
// renders a pant-leg silhouette), GarmentSketch.jsx does NOT wire this
// component into its live lookup yet — selecting suit shows the generic
// "coming soon" placeholder instead. Wire it back in once real art replaces
// suitItalian/suitFormal/suitDoubleBreasted below.
//
// italian/formal differ by shoulder structure and ease/length on what is,
// per plan.md §2, a shared base silhouette — genuinely a continuum, the same
// relationship PantSketch's REGULAR_STATES has between slim and relaxed. So
// both fitTypes resolve to the same 2-point crossfade array and fitValue
// positions between them.
//
// double_breasted is a structurally different garment (its own front-panel
// art, not a point on that continuum), so it gets its own single-state
// (non-crossfading) entry — the same pattern as PantSketch's
// SLIM_STATES/RELAXED_STATES/BAGGY_STATES.
const ITALIAN_FORMAL_STATES = [
  { at: 0, src: suitItalian },
  { at: 1, src: suitFormal },
];
const DOUBLE_BREASTED_STATES = [{ at: 0, src: suitDoubleBreasted }];

const FIT_STATES_BY_TYPE = {
  double_breasted: DOUBLE_BREASTED_STATES,
  italian: ITALIAN_FORMAL_STATES,
  formal: ITALIAN_FORMAL_STATES,
};

const PRINT_PATTERNS = {
  striped: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.3'/%3E%3C/svg%3E",
  checked: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.25'/%3E%3Crect width='16' height='7' fill='%232B2A28' opacity='0.25'/%3E%3C/svg%3E",
};

const CAN_MASK = supportsCssMask();

export default function SuitSketch({ fitValue = 0, fitType = "formal", colorHex = "#D6D6D2", printPattern = "solid" }) {
  const fitStates = FIT_STATES_BY_TYPE[fitType] ?? ITALIAN_FORMAL_STATES;
  const opacities = crossfadeOpacities(fitValue, fitStates);
  const printOverlay = useMemo(() => PRINT_PATTERNS[printPattern] ?? null, [printPattern]);

  return (
    <div
      className="relative mx-auto aspect-[16/9] w-full max-w-xl"
      role="img"
      aria-label={`Suit sketch, ${fitType} fit, ${printPattern} fabric`}
    >
      {fitStates.map((state, i) => {
        const opacity = opacities[i];
        if (opacity <= 0) return null;
        const maskStyle = {
          WebkitMaskImage: `url(${state.src})`,
          maskImage: `url(${state.src})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        };
        return (
          <div
            key={state.src}
            data-testid={`suit-fit-layer-${i}`}
            className="absolute inset-0 transition-opacity motion-reduce:transition-none"
            style={{ opacity }}
          >
            <img src={state.src} alt="" className="absolute inset-0 h-full w-full object-contain" />
            {CAN_MASK && (
              <>
                <div
                  data-testid="suit-tint-layer"
                  className="absolute inset-0"
                  style={{ ...maskStyle, backgroundColor: colorHex, mixBlendMode: "multiply" }}
                />
                {printOverlay && (
                  <div
                    data-testid="suit-print-layer"
                    className="absolute inset-0"
                    style={{ ...maskStyle, backgroundImage: `url("${printOverlay}")`, mixBlendMode: "multiply" }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
