import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { exportSketchPng } from "./exportSketchPng.js";

vi.mock("html-to-image", () => ({
  toCanvas: vi.fn(),
}));

import { toCanvas } from "html-to-image";

function makeFakeSketchCanvas(width = 400, height = 300) {
  return { width, height };
}

describe("exportSketchPng", () => {
  let fakeCtx;
  let clickSpy;
  let getContextSpy;
  let toDataURLSpy;
  let clickedLink;

  beforeEach(() => {
    toCanvas.mockReset();
    toCanvas.mockResolvedValue(makeFakeSketchCanvas());

    fakeCtx = {
      fillStyle: "",
      font: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
    };
    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(fakeCtx);
    toDataURLSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,fake");
    clickedLink = null;
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      clickedLink = { href: this.href, download: this.download };
    });
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    toDataURLSpy.mockRestore();
    clickSpy.mockRestore();
  });

  test("resolves without throwing and triggers a download, given measurements", async () => {
    const sketchElement = document.createElement("div");

    await expect(
      exportSketchPng(sketchElement, { chest: 42, waist: 36 })
    ).resolves.toBeUndefined();

    expect(toCanvas).toHaveBeenCalledWith(sketchElement, expect.any(Object));
    expect(fakeCtx.drawImage).toHaveBeenCalled();
    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Chest: 42"),
      expect.any(Number),
      expect.any(Number)
    );
    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Waist: 36"),
      expect.any(Number),
      expect.any(Number)
    );
    expect(toDataURLSpy).toHaveBeenCalledWith("image/png");
    expect(clickSpy).toHaveBeenCalled();
    expect(clickedLink.download).toBe("sketch.png");
    expect(clickedLink.href).toBe("data:image/png;base64,fake");
  });

  test("scales the measurement text's font to match the sketch's pixelRatio-rendered density", async () => {
    // toCanvas({ pixelRatio: 2, ... }) renders the sketch at 2x density, so the text
    // block must use a 2x font size too, or it reads roughly half the sketch's visual
    // size in the final composite (see task-10 fix-round in task-10-report.md).
    const sketchElement = document.createElement("div");

    await exportSketchPng(sketchElement, { chest: 42 });

    expect(toCanvas).toHaveBeenCalledWith(
      sketchElement,
      expect.objectContaining({ pixelRatio: 2 })
    );
    expect(fakeCtx.font).toBe("32px sans-serif");
  });

  test("an empty measurements object does not throw and shows a placeholder note instead of a measurements list", async () => {
    const sketchElement = document.createElement("div");

    await expect(exportSketchPng(sketchElement, {})).resolves.toBeUndefined();

    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      "No measurements selected yet",
      expect.any(Number),
      expect.any(Number)
    );
    expect(clickSpy).toHaveBeenCalled();
  });

  test("a missing measurements argument defaults to the empty case and does not throw", async () => {
    const sketchElement = document.createElement("div");

    await expect(exportSketchPng(sketchElement)).resolves.toBeUndefined();

    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      "No measurements selected yet",
      expect.any(Number),
      expect.any(Number)
    );
    expect(clickSpy).toHaveBeenCalled();
  });

  test("ignores blank-string and null/undefined measurement values as unset", async () => {
    const sketchElement = document.createElement("div");

    await exportSketchPng(sketchElement, { chest: "", waist: null, neck: undefined, hip: 50 });

    expect(fakeCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Hip: 50"),
      expect.any(Number),
      expect.any(Number)
    );
    for (const [, call] of fakeCtx.fillText.mock.calls.entries()) {
      expect(call[0]).not.toContain("Chest");
      expect(call[0]).not.toContain("Waist");
      expect(call[0]).not.toContain("Neck");
    }
  });
});
