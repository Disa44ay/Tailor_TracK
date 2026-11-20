import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HowItWorks from "./HowItWorks.jsx";

describe("HowItWorks", () => {
  test("exposes the #how-it-works anchor target", () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector("#how-it-works")).toBeInTheDocument();
  });

  test("lists the four real steps", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/measurements/i)).toBeInTheDocument();
    expect(screen.getByText(/place.*order|order.*place/i)).toBeInTheDocument();
    expect(screen.getByText(/pay|advance/i)).toBeInTheDocument();
    expect(screen.getByText(/track|pickup|status/i)).toBeInTheDocument();
  });
});
