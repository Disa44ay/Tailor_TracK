// frontend/src/components/home/Hero.test.jsx
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageContext } from "../../app/LanguageContext.jsx";
import Hero from "./Hero.jsx";

function renderHero(props = {}) {
  return render(
    <MemoryRouter>
      <LanguageContext.Provider value={{ lang: "en", toggleLang: () => {} }}>
        <Hero onLetsGo={() => {}} {...props} />
      </LanguageContext.Provider>
    </MemoryRouter>
  );
}

describe("Hero", () => {
  test("renders the headline and subcopy", () => {
    renderHero();
    expect(screen.getByText(/custom tailoring for men who want it right/i)).toBeInTheDocument();
    expect(screen.getByText(/custom clothing studio/i)).toBeInTheDocument();
  });

  test("primary CTA calls onLetsGo instead of navigating", () => {
    const onLetsGo = vi.fn();
    renderHero({ onLetsGo });
    const button = screen.getByRole("button", { name: /book a consultation/i });
    fireEvent.click(button);
    expect(onLetsGo).toHaveBeenCalled();
  });

  test("secondary CTA points at the how-it-works anchor", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /see how it works/i })).toHaveAttribute("href", "#how-it-works");
  });
});
