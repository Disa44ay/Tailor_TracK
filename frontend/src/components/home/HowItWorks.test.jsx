import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HowItWorks from "./HowItWorks.jsx";

describe("HowItWorks", () => {
  test("exposes the #how-it-works anchor target", () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector("#how-it-works")).toBeInTheDocument();
  });

  test("lists the four real steps, in order", () => {
    render(<HowItWorks />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Send an enquiry",
      "Book a fitting",
      "Decide the fit",
      "Collect your piece",
    ]);
  });

  test("has a closing call to action", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("link", { name: /book a consultation/i })).toBeInTheDocument();
  });
});
