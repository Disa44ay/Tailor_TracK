import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero.jsx";

function renderHero(props = {}) {
  return render(<MemoryRouter><Hero onLetsGo={() => {}} {...props} /></MemoryRouter>);
}

describe("Hero", () => {
  test("renders the headline and the first caption", () => {
    renderHero();
    expect(screen.getByRole("heading", { name: /custom tailoring, made to your measure/i })).toBeInTheDocument();
    expect(screen.getByText("Pinned before the fitting")).toBeInTheDocument();
  });

  test("renders three slides and three progress buttons", () => {
    const { container } = renderHero();
    expect(container.querySelectorAll(".hero-slider__item")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /show \d of 3/i })).toHaveLength(3);
  });

  test("no image has a caption under it", () => {
    const { container } = renderHero();
    expect(container.querySelector("figcaption")).toBeNull();
  });

  test("slide images have alt text", () => {
    const { container } = renderHero();
    container.querySelectorAll(".hero-slider img").forEach((img) => {
      expect(img.getAttribute("alt")).toBeTruthy();
    });
  });

  test("primary CTA calls onLetsGo", () => {
    const onLetsGo = vi.fn();
    renderHero({ onLetsGo });
    fireEvent.click(screen.getByRole("button", { name: /book a consultation/i }));
    expect(onLetsGo).toHaveBeenCalled();
  });
});
