import { useMemo } from "react";
import pantSlim from "./assets/pant-slim.webp";
import pantRelaxed from "./assets/pant-relaxed.webp";
import pantBaggy from "./assets/pant-baggy.webp";
import { crossfadeOpacities, supportsCssMask } from "./ShirtSketch.jsx";

// Illustrated, transparent-background fit-state images, generated to match
// ShirtSketch's art direction (see
// docs/superpowers/references/2026-11-21-sketch-fabric-drape-reference.png).
//
// Only one width-scale "pair" of art was generated (slim/relaxed/baggy as
// three points on a single leg-width continuum), because fit options differ
// in two unrelated ways: pure leg width (slim <-> baggy, which a crossfade
// genuinely captures) and leg *shape* (bootcut's hem-only flare, straightcut's
// uniform non-tapered leg) which a width crossfade can't represent at all.
// bootcut/straightcut each need their own dedicated art pair; that art wasn't
// generated this pass (image-generation quota ran out — see task-5-report.md),
// so they currently borrow the nearest existing pair as a placeholder. Adding
// their real art later only means adding entries here, nothing else changes.
const WIDTH_SCALE_STATES = [
  { at: 0, src: pantSlim },
  { at: 0.5, src: pantRelaxed },
  { at: 1, src: pantBaggy },
];

// Placeholder: fitted thigh/knee like "slim", widening toward "relaxed" — the
// hem-only flare isn't illustrated yet.
const BOOTCUT_PLACEHOLDER_STATES = [
  { at: 0, src: pantSlim },
  { at: 1, src: pantRelaxed },
];

// Placeholder: closer to "relaxed" and "baggy" (both looser through the leg)
// than to "slim" — the uniform, non-tapered silhouette isn't illustrated yet.
const STRAIGHTCUT_PLACEHOLDER_STATES = [
  { at: 0, src: pantRelaxed },
  { at: 1, src: pantBaggy },
];

const FIT_STATES_BY_TYPE = {
  slim: WIDTH_SCALE_STATES,
  regular: WIDTH_SCALE_STATES,
  relaxed: WIDTH_SCALE_STATES,
  baggy: WIDTH_SCALE_STATES,
  bootcut: BOOTCUT_PLACEHOLDER_STATES,
  straightcut: STRAIGHTCUT_PLACEHOLDER_STATES,
};

const PRINT_PATTERNS = {
  striped: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.3'/%3E%3C/svg%3E",
  checked: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.25'/%3E%3Crect width='16' height='7' fill='%232B2A28' opacity='0.25'/%3E%3C/svg%3E",
};

const CAN_MASK = supportsCssMask();

export default function PantSketch({ fitValue = 0, fitType = "regular", colorHex = "#D6D6D2", printPattern = "solid" }) {
  const fitStates = FIT_STATES_BY_TYPE[fitType] ?? WIDTH_SCALE_STATES;
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
