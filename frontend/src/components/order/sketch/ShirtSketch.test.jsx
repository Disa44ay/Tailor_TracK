import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import ShirtSketch, { crossfadeOpacities } from "./ShirtSketch.jsx";
import shirtSlim from "./assets/shirt-slim.webp";

describe("crossfadeOpacities", () => {
  test("is fully the first state at the lowest value", () => {
    expect(crossfadeOpacities(0)).toEqual([1, 0]);
  });

  test("is fully the last state at the highest value", () => {
    expect(crossfadeOpacities(1)).toEqual([0, 1]);
  });

  test("blends both states evenly at the midpoint", () => {
    const [a, b] = crossfadeOpacities(0.5);
    expect(a).toBeCloseTo(0.5);
    expect(b).toBeCloseTo(0.5);
  });

  test("clamps out-of-range values", () => {
    expect(crossfadeOpacities(-1)).toEqual([1, 0]);
    expect(crossfadeOpacities(2)).toEqual([0, 1]);
  });

  test("treats a non-finite value as 0 instead of making every state fully opaque", () => {
    expect(crossfadeOpacities(NaN)).toEqual([1, 0]);
    expect(crossfadeOpacities(undefined)).toEqual([1, 0]);
  });

  test("supports more than two states", () => {
    const states = [{ at: 0 }, { at: 0.5 }, { at: 1 }];
    expect(crossfadeOpacities(0, states)).toEqual([1, 0, 0]);
    expect(crossfadeOpacities(0.5, states)).toEqual([0, 1, 0]);
    expect(crossfadeOpacities(1, states)).toEqual([0, 0, 1]);
    const [a, b, c] = crossfadeOpacities(0.25, states);
    expect(a).toBeCloseTo(0.5);
    expect(b).toBeCloseTo(0.5);
    expect(c).toBeCloseTo(0);
  });
});

describe("ShirtSketch", () => {
  test("renders a layer for each visible fit state, tinted with the given colour", () => {
    const { container } = render(<ShirtSketch fitValue={0} colorHex="#2F4C86" />);
    const layer = container.querySelector('[data-testid="shirt-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    const tint = layer.querySelectorAll("div")[0];
    expect(tint).toHaveStyle({ backgroundColor: "#2F4C86", mixBlendMode: "multiply" });
  });

  test("hides a fit layer entirely once its opacity reaches zero", () => {
    const { container } = render(<ShirtSketch fitValue={0} />);
    expect(container.querySelector('[data-testid="shirt-fit-layer-1"]')).not.toBeInTheDocument();
  });

  test("does not render a print overlay for a solid fabric", () => {
    const { container } = render(<ShirtSketch fitValue={0} printPattern="solid" />);
    const layer = container.querySelector('[data-testid="shirt-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(2);
  });

  test("renders a print overlay for a striped or checked fabric", () => {
    const { container } = render(<ShirtSketch fitValue={0} printPattern="striped" />);
    const layer = container.querySelector('[data-testid="shirt-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(3);
  });

  test("has an accessible label naming the fabric", () => {
    const { getByRole } = render(<ShirtSketch texture="silk" printPattern="checked" />);
    expect(getByRole("img", { name: /silk checked/i })).toBeInTheDocument();
  });

  test("masks the tint, texture and print layers to the exact fit-state image, not a plain rectangle", () => {
    const { container } = render(<ShirtSketch fitValue={0} printPattern="striped" />);
    for (const testId of ["shirt-tint-layer", "shirt-texture-layer", "shirt-print-layer"]) {
      const layer = container.querySelector(`[data-testid="${testId}"]`);
      expect(layer).toBeInTheDocument();
      const mask = layer.style.maskImage || layer.style.webkitMaskImage;
      expect(mask).toContain(shirtSlim);
    }
  });

  test("degrades to the plain illustration, not a solid block, for an unrecognized texture or print pattern", () => {
    const { container } = render(<ShirtSketch fitValue={0} texture="velvet" printPattern="paisley" />);
    const layer = container.querySelector('[data-testid="shirt-fit-layer-0"]');
    expect(layer.querySelector('[data-testid="shirt-print-layer"]')).not.toBeInTheDocument();
    expect(layer.querySelector('[data-testid="shirt-texture-layer"]')).toBeInTheDocument();
  });
});
