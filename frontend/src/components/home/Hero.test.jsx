// frontend/src/components/home/Hero.test.jsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero.jsx";

function renderHero() {
  return render(<MemoryRouter><Hero /></MemoryRouter>);
}

describe("Hero", () => {
  test("renders the headline and subcopy", () => {
    renderHero();
    expect(screen.getByText(/you imagine it\. we tailor it/i)).toBeInTheDocument();
    expect(screen.getByText(/measurements, orders, and fittings/i)).toBeInTheDocument();
  });

  test("primary CTA goes to /signup", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /let's go/i })).toHaveAttribute("href", "/signup");
  });

  test("secondary CTA points at the how-it-works anchor", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /see how it works/i })).toHaveAttribute("href", "#how-it-works");
  });
});
