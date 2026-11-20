// frontend/src/components/home/Hero.test.jsx
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero.jsx";

function renderHero(props = {}) {
  return render(<MemoryRouter><Hero onLetsGo={() => {}} {...props} /></MemoryRouter>);
}

describe("Hero", () => {
  test("renders the headline and subcopy", () => {
    renderHero();
    expect(screen.getByText(/you imagine it\. we tailor it/i)).toBeInTheDocument();
    expect(screen.getByText(/measurements, orders, and fittings/i)).toBeInTheDocument();
  });

  test("primary CTA calls onLetsGo instead of navigating", () => {
    const onLetsGo = vi.fn();
    renderHero({ onLetsGo });
    const button = screen.getByRole("button", { name: /let's go/i });
    fireEvent.click(button);
    expect(onLetsGo).toHaveBeenCalled();
  });

  test("secondary CTA points at the how-it-works anchor", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /see how it works/i })).toHaveAttribute("href", "#how-it-works");
  });
});
