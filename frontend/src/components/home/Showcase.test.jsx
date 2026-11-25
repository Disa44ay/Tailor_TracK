import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Showcase from "./Showcase.jsx";

describe("Showcase", () => {
  test("names the section What we make", () => {
    render(<Showcase />);
    expect(screen.getByRole("heading", { level: 2, name: "What we make" })).toBeInTheDocument();
  });

  test("lists the six garments in order", () => {
    render(<Showcase />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Italian suit",
      "Double-breasted suit",
      "Bootcut trousers",
      "Straight-fit trousers",
      "Formal shirt",
      "Cuban shirt",
    ]);
  });

  test("every garment image has alt text", () => {
    const { container } = render(<Showcase />);
    expect(container.querySelectorAll(".showcase-item img")).toHaveLength(2);
    container.querySelectorAll(".showcase-item img").forEach((img) => {
      expect(img.getAttribute("alt")).toBeTruthy();
    });
  });
});
