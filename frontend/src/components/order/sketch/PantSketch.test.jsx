import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import PantSketch from "./PantSketch.jsx";
import pantSlim from "./assets/pant-slim.webp";
import pantRelaxed from "./assets/pant-relaxed.webp";
import pantBaggy from "./assets/pant-baggy.webp";

describe("PantSketch", () => {
  test("renders a layer for each visible fit state, tinted with the given colour", () => {
    const { container } = render(<PantSketch fitValue={0} fitType="slim" colorHex="#2F4C86" />);
    const layer = container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    const tint = layer.querySelectorAll("div")[0];
    expect(tint).toHaveStyle({ backgroundColor: "#2F4C86", mixBlendMode: "multiply" });
  });

  test("hides a fit layer entirely once its opacity reaches zero", () => {
    // "regular" is the one fitType that actually crossfades (slim <-> relaxed),
    // so it's the one with more than one state to hide.
    const { container } = render(<PantSketch fitValue={0} fitType="regular" />);
    expect(container.querySelector('[data-testid="pant-fit-layer-1"]')).not.toBeInTheDocument();
  });

  test("does not render a print overlay for a solid fabric", () => {
    const { container } = render(<PantSketch fitValue={0} fitType="slim" printPattern="solid" />);
    const layer = container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(1);
  });

  test("renders a print overlay for a striped or checked fabric", () => {
    const { container } = render(<PantSketch fitValue={0} fitType="slim" printPattern="striped" />);
    const layer = container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(2);
  });

  test("has an accessible label naming the fit and fabric", () => {
    const { getByRole } = render(<PantSketch fitType="bootcut" printPattern="checked" />);
    expect(getByRole("img", { name: /bootcut.*checked/i })).toBeInTheDocument();
  });

  test("masks the tint and print layers to the exact fit-state image, not a plain rectangle", () => {
    const { container } = render(<PantSketch fitValue={0} fitType="slim" printPattern="striped" />);
    for (const testId of ["pant-tint-layer", "pant-print-layer"]) {
      const layer = container.querySelector(`[data-testid="${testId}"]`);
      expect(layer).toBeInTheDocument();
      const mask = layer.style.maskImage || layer.style.webkitMaskImage;
      expect(mask).toContain(pantSlim);
    }
  });

  test("degrades to the plain illustration, not a solid block, for an unrecognized fitType or printPattern", () => {
    const { container } = render(<PantSketch fitValue={0} fitType="pleated" printPattern="paisley" />);
    const layer = container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    expect(layer.querySelector('[data-testid="pant-print-layer"]')).not.toBeInTheDocument();
    expect(layer.querySelector('[data-testid="pant-tint-layer"]')).toBeInTheDocument();
  });

  test("slim, relaxed and baggy are distinct silhouettes, not points on one shared curve", () => {
    // Regression test: these three used to share a single width-scale array, which meant
    // switching fitType between them at a fixed fitValue rendered the identical image —
    // only the aria-label text differed. Each must now resolve to its own asset.
    const assetFor = (fitType) => {
      const { container, unmount } = render(<PantSketch fitValue={0} fitType={fitType} />);
      const src = container.querySelector('[data-testid="pant-fit-layer-0"] img').src;
      unmount();
      return src;
    };

    const slim = assetFor("slim");
    const relaxed = assetFor("relaxed");
    const baggy = assetFor("baggy");

    expect(slim).toContain(pantSlim);
    expect(relaxed).toContain(pantRelaxed);
    expect(baggy).toContain(pantBaggy);
    expect(new Set([slim, relaxed, baggy]).size).toBe(3);
  });

  test("switching fitType between bootcut and straightcut changes which placeholder asset appears", () => {
    // bootcut and straightcut don't have dedicated art yet (see PantSketch.jsx's
    // FIT_STATES_BY_TYPE comment) but still map to different placeholder pairs.
    const bootcut = render(<PantSketch fitValue={0} fitType="bootcut" />);
    const bootcutLayer = bootcut.container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(bootcutLayer.querySelector("img").src).toContain(pantSlim);
    bootcut.unmount();

    const straightcut = render(<PantSketch fitValue={0} fitType="straightcut" />);
    const straightcutLayer = straightcut.container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(straightcutLayer.querySelector("img").src).not.toContain(pantSlim);
  });

  test("bootcut and straightcut placeholders still crossfade across fitValue, unlike slim/relaxed/baggy", () => {
    // Regression test: a previous fix round accidentally collapsed these placeholder
    // pairs down to a single fixed image (same mistake as the slim/relaxed/baggy bug,
    // just introduced while fixing that one). Each must still have two distinct states
    // reachable at opposite ends of fitValue.
    for (const fitType of ["bootcut", "straightcut"]) {
      const atStart = render(<PantSketch fitValue={0} fitType={fitType} />);
      const startLayer = atStart.container.querySelector('[data-testid="pant-fit-layer-0"]');
      const startSrc = startLayer.querySelector("img").src;
      const startOpacity = startLayer.style.opacity;
      atStart.unmount();

      const atEnd = render(<PantSketch fitValue={1} fitType={fitType} />);
      // At fitValue=1 the first state (index 0, the one visible at fitValue=0) must be
      // fully faded out — either unmounted entirely or rendered at opacity 0 — while a
      // second, different-asset layer takes over.
      const endLayer0 = atEnd.container.querySelector('[data-testid="pant-fit-layer-0"]');
      if (endLayer0) {
        expect(Number(endLayer0.style.opacity)).toBeLessThan(Number(startOpacity) || 1);
      }
      const endLayer1 = atEnd.container.querySelector('[data-testid="pant-fit-layer-1"]');
      expect(endLayer1).toBeInTheDocument();
      expect(endLayer1.querySelector("img").src).not.toBe(startSrc);
      atEnd.unmount();
    }
  });
});
