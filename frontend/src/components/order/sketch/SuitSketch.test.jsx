import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import SuitSketch from "./SuitSketch.jsx";
import suitItalian from "./assets/suit-italian.webp";
import suitFormal from "./assets/suit-formal.webp";
import suitDoubleBreasted from "./assets/suit-double-breasted.webp";

describe("SuitSketch", () => {
  test("renders a layer for each visible fit state, tinted with the given colour", () => {
    const { container } = render(<SuitSketch fitValue={0} fitType="double_breasted" colorHex="#2F4C86" />);
    const layer = container.querySelector('[data-testid="suit-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    const tint = layer.querySelectorAll("div")[0];
    expect(tint).toHaveStyle({ backgroundColor: "#2F4C86", mixBlendMode: "multiply" });
  });

  test("hides a fit layer entirely once its opacity reaches zero", () => {
    // italian/formal crossfade on a shared base silhouette, so at one end of
    // fitValue the other state's layer must be gone, not just dimmed.
    const { container } = render(<SuitSketch fitValue={0} fitType="italian" />);
    expect(container.querySelector('[data-testid="suit-fit-layer-1"]')).not.toBeInTheDocument();
  });

  test("does not render a print overlay for a solid fabric", () => {
    const { container } = render(<SuitSketch fitValue={0} fitType="double_breasted" printPattern="solid" />);
    const layer = container.querySelector('[data-testid="suit-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(1);
  });

  test("renders a print overlay for a striped or checked fabric", () => {
    const { container } = render(<SuitSketch fitValue={0} fitType="double_breasted" printPattern="striped" />);
    const layer = container.querySelector('[data-testid="suit-fit-layer-0"]');
    expect(layer.querySelectorAll("div")).toHaveLength(2);
  });

  test("has an accessible label naming the fit and fabric", () => {
    const { getByRole } = render(<SuitSketch fitType="formal" printPattern="checked" />);
    expect(getByRole("img", { name: /formal.*checked/i })).toBeInTheDocument();
  });

  test("masks the tint and print layers to the exact fit-state image, not a plain rectangle", () => {
    const { container } = render(<SuitSketch fitValue={0} fitType="double_breasted" printPattern="striped" />);
    for (const testId of ["suit-tint-layer", "suit-print-layer"]) {
      const layer = container.querySelector(`[data-testid="${testId}"]`);
      expect(layer).toBeInTheDocument();
      const mask = layer.style.maskImage || layer.style.webkitMaskImage;
      expect(mask).toContain(suitDoubleBreasted);
    }
  });

  test("degrades to the plain illustration, not a solid block, for an unrecognized fitType or printPattern", () => {
    const { container } = render(<SuitSketch fitValue={0} fitType="tuxedo" printPattern="paisley" />);
    const layer = container.querySelector('[data-testid="suit-fit-layer-0"]');
    expect(layer).toBeInTheDocument();
    expect(layer.querySelector('[data-testid="suit-print-layer"]')).not.toBeInTheDocument();
    expect(layer.querySelector('[data-testid="suit-tint-layer"]')).toBeInTheDocument();
  });

  test("double_breasted renders its own distinct asset, not a cross-fade blend with italian/formal", () => {
    // Regression guard for the brief's explicit requirement: double_breasted is a
    // structurally different garment (separate front panel), not a third point on
    // the italian/formal crossfade axis, so it must never show a second layer.
    const { container } = render(<SuitSketch fitValue={0} fitType="double_breasted" />);
    const src = container.querySelector('[data-testid="suit-fit-layer-0"] img').src;
    expect(src).toContain(suitDoubleBreasted);
    expect(src).not.toContain(suitItalian);
    expect(src).not.toContain(suitFormal);
    expect(container.querySelector('[data-testid="suit-fit-layer-1"]')).not.toBeInTheDocument();
  });

  test("double_breasted ignores fitValue entirely, unlike italian/formal", () => {
    const atStart = render(<SuitSketch fitValue={0} fitType="double_breasted" />);
    const startSrc = atStart.container.querySelector('[data-testid="suit-fit-layer-0"] img').src;
    atStart.unmount();

    const atEnd = render(<SuitSketch fitValue={1} fitType="double_breasted" />);
    const endSrc = atEnd.container.querySelector('[data-testid="suit-fit-layer-0"] img').src;
    expect(endSrc).toBe(startSrc);
    expect(atEnd.container.querySelector('[data-testid="suit-fit-layer-1"]')).not.toBeInTheDocument();
    atEnd.unmount();
  });

  test("italian and formal crossfade across fitValue on the shared base silhouette", () => {
    const atStart = render(<SuitSketch fitValue={0} fitType="italian" />);
    const startLayer = atStart.container.querySelector('[data-testid="suit-fit-layer-0"]');
    const startSrc = startLayer.querySelector("img").src;
    expect(startSrc).toContain(suitItalian);
    atStart.unmount();

    const atEnd = render(<SuitSketch fitValue={1} fitType="italian" />);
    const endLayer0 = atEnd.container.querySelector('[data-testid="suit-fit-layer-0"]');
    if (endLayer0) {
      expect(Number(endLayer0.style.opacity)).toBeLessThan(1);
    }
    const endLayer1 = atEnd.container.querySelector('[data-testid="suit-fit-layer-1"]');
    expect(endLayer1).toBeInTheDocument();
    expect(endLayer1.querySelector("img").src).toContain(suitFormal);
    atEnd.unmount();
  });
});
