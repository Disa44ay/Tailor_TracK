import { useMemo } from "react";
import pantSlim from "./assets/pant-slim.webp";
import pantRelaxed from "./assets/pant-relaxed.webp";
import pantBaggy from "./assets/pant-baggy.webp";
import { crossfadeOpacities, supportsCssMask } from "./ShirtSketch.jsx";

// Illustrated, transparent-background fit-state images, generated to match
// ShirtSketch's art direction (see
// docs/superpowers/references/2026-11-21-sketch-fabric-drape-reference.png).
//
// slim/bootcut/baggy/straightcut are each a *distinct silhouette*, not points
// on one width curve — picking one of them is picking a fixed drawing, so
// each gets its own single-state (non-crossfading) entry. Only "regular" sits
// genuinely between two drawn silhouettes (slim and relaxed), so it's the one
// fitType that actually crossfades on fitValue. bootcut/straightcut don't have
// their own dedicated art yet (image-generation quota ran out this pass — see
// task-5-report.md), so they borrow the nearest existing single state as a
// placeholder. Adding their real art later only means adding/replacing
// entries here, nothing else changes.
const SLIM_STATES = [{ at: 0, src: pantSlim }];
const RELAXED_STATES = [{ at: 0, src: pantRelaxed }];
const BAGGY_STATES = [{ at: 0, src: pantBaggy }];
const REGULAR_STATES = [
  { at: 0, src: pantSlim },
  { at: 1, src: pantRelaxed },
];

// Placeholder: fitted thigh/knee, closer to "slim" than to anything wider —
// the hem-only flare isn't illustrated yet.
const BOOTCUT_PLACEHOLDER_STATES = SLIM_STATES;

// Placeholder: a uniform, non-tapered leg reads closer to "relaxed" than to
// "slim" or "baggy" — the uniform non-taper itself isn't illustrated yet.
const STRAIGHTCUT_PLACEHOLDER_STATES = RELAXED_STATES;

const FIT_STATES_BY_TYPE = {
  slim: SLIM_STATES,
  regular: REGULAR_STATES,
  relaxed: RELAXED_STATES,
  baggy: BAGGY_STATES,
  bootcut: BOOTCUT_PLACEHOLDER_STATES,
  straightcut: STRAIGHTCUT_PLACEHOLDER_STATES,
};

const PRINT_PATTERNS = {
  striped: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.3'/%3E%3C/svg%3E",
  checked: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.25'/%3E%3Crect width='16' height='7' fill='%232B2A28' opacity='0.25'/%3E%3C/svg%3E",
};

const CAN_MASK = supportsCssMask();

export default function PantSketch({ fitValue = 0, fitType = "regular", colorHex = "#D6D6D2", printPattern = "solid" }) {
  const fitStates = FIT_STATES_BY_TYPE[fitType] ?? REGULAR_STATES;
  const opacities = crossfadeOpacities(fitValue, fitStates);
  const printOverlay = useMemo(() => PRINT_PATTERNS[printPattern] ?? null, [printPattern]);

  return (
    <div
      className="relative mx-auto aspect-[16/9] w-full max-w-xl"
      role="img"
      aria-label={`Pant sketch, ${fitType} fit, ${printPattern} fabric`}
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
            data-testid={`pant-fit-layer-${i}`}
            className="absolute inset-0 transition-opacity motion-reduce:transition-none"
            style={{ opacity }}
          >
            <img src={state.src} alt="" className="absolute inset-0 h-full w-full object-contain" />
            {CAN_MASK && (
              <>
                <div
                  data-testid="pant-tint-layer"
                  className="absolute inset-0"
                  style={{ ...maskStyle, backgroundColor: colorHex, mixBlendMode: "multiply" }}
                />
                {printOverlay && (
                  <div
                    data-testid="pant-print-layer"
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
