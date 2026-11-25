import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HowItWorks from "./HowItWorks.jsx";

describe("HowItWorks", () => {
  test("exposes the #how-it-works anchor target", () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector("#how-it-works")).toBeInTheDocument();
  });

  test("the diagram spec names the four real steps, in order", () => {
    const { container } = render(<HowItWorks />);
    const spec = JSON.parse(container.querySelector('[data-diagram] script').textContent);
    expect(spec.steps.map((s) => s.label)).toEqual([
      "Enquiry sent",
      "Fitting booked",
      "Fit decided",
      "Piece collected",
    ]);
  });

  test("has a closing call to action matching the hero's wording", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("link", { name: /book a consultation/i })).toBeInTheDocument();
  });
});
