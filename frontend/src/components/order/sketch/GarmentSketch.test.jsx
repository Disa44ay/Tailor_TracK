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

  // panjabi/suit/paijama have real sketch components (PanjabiSketch/SuitSketch/
  // PaijamaSketch), but their art is 100% placeholder reused from other
  // garments, so GarmentSketch deliberately doesn't wire them in yet — each
  // should render the generic "coming soon" placeholder instead of
  // confidently showing the wrong garment.
  test("dressType panjabi renders a placeholder instead of PanjabiSketch", () => {
    render(<GarmentSketch {...baseProps} dressType="panjabi" />);
    expect(screen.getByText("Panjabi sketch coming soon")).toBeInTheDocument();
  });

  test("dressType suit renders a placeholder instead of SuitSketch", () => {
    render(<GarmentSketch {...baseProps} dressType="suit" />);
    expect(screen.getByText("Suit sketch coming soon")).toBeInTheDocument();
  });

  test("dressType paijama renders a placeholder instead of PaijamaSketch", () => {
    render(<GarmentSketch {...baseProps} dressType="paijama" fitType="casual" printPattern="checked" />);
    expect(screen.getByText("Paijama sketch coming soon")).toBeInTheDocument();
  });

  test("an unknown dressType renders the placeholder instead of crashing", () => {
    render(<GarmentSketch {...baseProps} dressType="kurta" />);
    expect(screen.getByText("Kurta sketch coming soon")).toBeInTheDocument();
  });
});
