import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Approaches from "./Approaches.jsx";

describe("Approaches", () => {
  test("exposes the #approaches anchor target", () => {
    const { container } = render(<Approaches />);
    expect(container.querySelector("#approaches")).toBeInTheDocument();
  });

  test("names both approaches", () => {
    render(<Approaches />);
    expect(screen.getByRole("heading", { name: /made to measure/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /bespoke/i })).toBeInTheDocument();
  });
});
