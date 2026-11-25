import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import PaijamaSketch from "./PaijamaSketch.jsx";
import paijamaShort from "./assets/paijama-short.webp";
import paijamaCasual from "./assets/paijama-casual.webp";

describe("PaijamaSketch", () => {
  test("renders a layer for the fit state, tinted with the given colour", () => {
    const { container } = render(<PaijamaSketch fitType="short" colorHex="#2F4C86" />);
    const layer = container.querySelector('[data-testid="paijama-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    const tint = layer.querySelectorAll("div")[0];
    expect(tint).toHaveStyle({ backgroundColor: "#2F4C86", mixBlendMode: "multiply" });
  });

  test("does not render a print overlay for a solid fabric", () => {
    const { container } = render(<PaijamaSketch fitType="short" printPattern="solid" />);
    const layer = container.querySelector('[data-testid="paijama-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(1);
  });

  test("renders a print overlay for a striped or checked fabric", () => {
    const { container } = render(<PaijamaSketch fitType="short" printPattern="striped" />);
    const layer = container.querySelector('[data-testid="paijama-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(2);
  });

  test("has an accessible label naming the fit and fabric", () => {
    const { getByRole } = render(<PaijamaSketch fitType="casual" printPattern="checked" />);
    expect(getByRole("img", { name: /casual.*checked/i })).toBeInTheDocument();
  });

  test("masks the tint and print layers to the exact fit-state image, not a plain rectangle", () => {
    const { container } = render(<PaijamaSketch fitType="short" printPattern="striped" />);
    for (const testId of ["paijama-tint-layer", "paijama-print-layer"]) {
      const layer = container.querySelector(`[data-testid="${testId}"]`);
      expect(layer).toBeInTheDocument();
      const mask = layer.style.maskImage || layer.style.webkitMaskImage;
      expect(mask).toContain(paijamaShort);
    }
  });

  test("degrades to the plain illustration, not a solid block, for an unrecognized fitType or printPattern", () => {
    const { container } = render(<PaijamaSketch fitType="cuban" printPattern="paisley" />);
    const layer = container.querySelector('[data-testid="paijama-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    expect(layer.querySelector('[data-testid="paijama-print-layer"]')).not.toBeInTheDocument();
    expect(layer.querySelector('[data-testid="paijama-tint-layer"]')).toBeInTheDocument();
  });

  test("short and casual are distinct silhouettes, not a crossfading width-scale pair", () => {
    // Regression test for Task 5's bug class: paijama's fitType is a discrete
    // length/looseness choice (short/casual), not a point on a continuum, so each
    // must resolve to its own fixed asset regardless of fitValue, and there must
    // never be a second layer.
    const assetFor = (fitType) => {
      const { container, unmount } = render(<PaijamaSketch fitType={fitType} />);
      const src = container.querySelector('[data-testid="paijama-fit-layer-0"] img').src;
      unmount();
      return src;
    };

    expect(assetFor("short")).toContain(paijamaShort);
    expect(assetFor("casual")).toContain(paijamaCasual);
  });

  test("fitValue never changes which asset renders and layer 1 never exists", () => {
    // Unlike PantSketch's "regular" (which genuinely crossfades slim<->relaxed),
    // paijama has no in-between state at all: fitValue is accepted for interface
    // consistency with the other sketch components but has no visual effect here.
    for (const fitType of ["short", "casual"]) {
      const atStart = render(<PaijamaSketch fitValue={0} fitType={fitType} />);
      const startSrc = atStart.container.querySelector('[data-testid="paijama-fit-layer-0"] img').src;
      expect(atStart.container.querySelector('[data-testid="paijama-fit-layer-1"]')).not.toBeInTheDocument();
      atStart.unmount();

      const atEnd = render(<PaijamaSketch fitValue={1} fitType={fitType} />);
      const endSrc = atEnd.container.querySelector('[data-testid="paijama-fit-layer-0"] img').src;
      expect(endSrc).toBe(startSrc);
      expect(atEnd.container.querySelector('[data-testid="paijama-fit-layer-1"]')).not.toBeInTheDocument();
      atEnd.unmount();
    }
  });
});
