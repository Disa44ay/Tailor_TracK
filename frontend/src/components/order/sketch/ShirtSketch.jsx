import { useMemo } from "react";
import shirtSlim from "./assets/shirt-slim.webp";
import shirtRegular from "./assets/shirt-regular.webp";

// Illustrated, transparent-background fit-state images — see
// docs/superpowers/references/2026-11-21-sketch-fabric-drape-reference.png
// for the art direction. Only 2 of the planned 3 states exist today (the
// "relaxed" generation hit a provider rate limit); FIT_STATES is the one
// place a third entry gets added later, nothing else changes.
const FIT_STATES = [
  { at: 0, src: shirtSlim },
  { at: 1, src: shirtRegular },
];

const CRISP_TEXTURES = new Set(["cotton", "linen", "denim"]);

const TEXTURE_PATTERNS = {
  crisp: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Cline x1='0' y1='0' x2='0' y2='6' stroke='%232B2A28' stroke-width='1' opacity='0.35'/%3E%3C/svg%3E",
  sheen: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26'%3E%3Cline x1='0' y1='0' x2='0' y2='26' stroke='%232B2A28' stroke-width='3' opacity='0.18'/%3E%3C/svg%3E",
};

const PRINT_PATTERNS = {
  striped: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.3'/%3E%3C/svg%3E",
  checked: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='7' height='16' fill='%232B2A28' opacity='0.25'/%3E%3Crect width='16' height='7' fill='%232B2A28' opacity='0.25'/%3E%3C/svg%3E",
};

// Computed once at module load, not per render — the browser's mask-image
// support doesn't change between renders.
export function supportsCssMask() {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function"
    ? CSS.supports("mask-image", "none") || CSS.supports("-webkit-mask-image", "none")
    : false;
}
const CAN_MASK = supportsCssMask();

export function crossfadeOpacities(fitValue, states = FIT_STATES) {
  const v = Number.isFinite(fitValue) ? Math.min(1, Math.max(0, fitValue)) : 0;
  return states.map((state, i) => {
    const prev = states[i - 1];
    const next = states[i + 1];
    if (prev && v < prev.at) return 0;
    if (next && v > next.at) return 0;
    let opacity = 1;
    if (prev && v < state.at) opacity = (v - prev.at) / (state.at - prev.at);
    if (next && v > state.at) opacity = 1 - (v - state.at) / (next.at - state.at);
    return Math.max(0, Math.min(1, opacity));
  });
}

export default function ShirtSketch({ fitValue = 1, colorHex = "#D6D6D2", texture = "cotton", printPattern = "solid" }) {
  const opacities = crossfadeOpacities(fitValue);
  const texturePatternUrl = useMemo(
    () => (CRISP_TEXTURES.has(texture) ? TEXTURE_PATTERNS.crisp : TEXTURE_PATTERNS.sheen),
    [texture]
  );
  const printOverlay = useMemo(() => PRINT_PATTERNS[printPattern] ?? null, [printPattern]);

  return (
    <div
      className="relative mx-auto aspect-[16/9] w-full max-w-xl"
      role="img"
      aria-label={`Shirt sketch, ${texture} ${printPattern} fabric`}
    >
      {FIT_STATES.map((state, i) => {
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
            data-testid={`shirt-fit-layer-${i}`}
            className="absolute inset-0 transition-opacity motion-reduce:transition-none"
            style={{ opacity }}
          >
            <img src={state.src} alt="" className="absolute inset-0 h-full w-full object-contain" />
            {CAN_MASK && (
              <>
                <div
                  data-testid="shirt-tint-layer"
                  className="absolute inset-0"
                  style={{ ...maskStyle, backgroundColor: colorHex, mixBlendMode: "multiply" }}
                />
                <div
                  data-testid="shirt-texture-layer"
                  className="absolute inset-0"
                  style={{ ...maskStyle, backgroundImage: `url("${texturePatternUrl}")`, mixBlendMode: "multiply" }}
                />
                {printOverlay && (
                  <div
                    data-testid="shirt-print-layer"
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
