import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import PantSketch from "./PantSketch.jsx";
import pantSlim from "./assets/pant-slim.webp";

describe("PantSketch", () => {
  test("renders a layer for each visible fit state, tinted with the given colour", () => {
    const { container } = render(<PantSketch fitValue={0} fitType="slim" colorHex="#2F4C86" />);
    const layer = container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    const tint = layer.querySelectorAll("div")[0];
    expect(tint).toHaveStyle({ backgroundColor: "#2F4C86", mixBlendMode: "multiply" });
  });

  test("hides a fit layer entirely once its opacity reaches zero", () => {
    const { container } = render(<PantSketch fitValue={0} fitType="slim" />);
    expect(container.querySelector('[data-testid="pant-fit-layer-2"]')).not.toBeInTheDocument();
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

  test("switching fitType between options that map to different fit-state pairs changes which asset appears", () => {
    // "slim" and "baggy" sit at opposite ends of the SAME width-scale pair in this
    // implementation (see PantSketch.jsx's FIT_STATES_BY_TYPE comment), so they are not
    // a valid example of "different pairs". "bootcut" and "straightcut" are, since each
    // is mapped to its own (currently placeholder) pair — use those instead.
    const bootcut = render(<PantSketch fitValue={0} fitType="bootcut" />);
    const bootcutLayer = bootcut.container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(bootcutLayer.querySelector("img").src).toContain(pantSlim);
    bootcut.unmount();

    const straightcut = render(<PantSketch fitValue={0} fitType="straightcut" />);
    const straightcutLayer = straightcut.container.querySelector('[data-testid="pant-fit-layer-0"]');
    expect(straightcutLayer.querySelector("img").src).not.toContain(pantSlim);
  });
});
