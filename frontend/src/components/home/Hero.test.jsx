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
    expect(screen.getByText("Tailored in navy")).toBeInTheDocument();
  });

  test("renders a background image and a strip of five items with progress bars", () => {
    const { container } = renderHero();
    expect(container.querySelector(".hero-bg img")).not.toBeNull();
    expect(container.querySelectorAll(".hero-strip__item")).toHaveLength(5);
    expect(container.querySelectorAll(".hero-progress span")).toHaveLength(5);
  });

  test("no image has a caption under it", () => {
    const { container } = renderHero();
    expect(container.querySelector("figcaption")).toBeNull();
  });

  test("every image has alt text", () => {
    const { container } = renderHero();
    container.querySelectorAll("img").forEach((img) => {
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
