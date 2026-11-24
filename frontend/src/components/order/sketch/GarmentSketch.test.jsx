import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GarmentSketch from "./GarmentSketch.jsx";

const baseProps = {
  fitValue: 1,
  fitType: "regular",
  colorHex: "#D6D6D2",
  printPattern: "striped",
  texture: "linen",
};

describe("GarmentSketch", () => {
  test("dressType shirt renders ShirtSketch with its props forwarded", () => {
    render(<GarmentSketch {...baseProps} dressType="shirt" />);
    // ShirtSketch's aria-label echoes texture and printPattern, so this proves they were forwarded.
    expect(screen.getByRole("img", { name: "Shirt sketch, linen striped fabric" })).toBeInTheDocument();
  });

  test("an unimplemented dressType renders a labeled placeholder instead of crashing", () => {
    render(<GarmentSketch {...baseProps} dressType="suit" />);
    expect(screen.getByText("Suit sketch coming soon")).toBeInTheDocument();
  });

  test("an unknown dressType renders the placeholder instead of crashing", () => {
    render(<GarmentSketch {...baseProps} dressType="kurta" />);
    expect(screen.getByText("Kurta sketch coming soon")).toBeInTheDocument();
  });
});
