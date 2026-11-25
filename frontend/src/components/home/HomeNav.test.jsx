import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageContext } from "../../app/LanguageContext.jsx";
import HomeNav from "./HomeNav.jsx";

function renderNav(props = {}) {
  return render(
    <MemoryRouter>
      <LanguageContext.Provider value={{ lang: "en", toggleLang: () => {} }}>
        <HomeNav onLogin={() => {}} {...props} />
      </LanguageContext.Provider>
    </MemoryRouter>
  );
}

describe("HomeNav", () => {
  test("shows the brand wordmark and desktop links", () => {
    renderNav();
    expect(screen.getByLabelText("অবয়ব")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute("href", "#how-it-works");
  });

  test("desktop Log in control calls onLogin instead of navigating", () => {
    const onLogin = vi.fn();
    renderNav({ onLogin });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(onLogin).toHaveBeenCalled();
  });

  test("mobile menu toggle starts collapsed and exposes aria-expanded", () => {
    renderNav();
    const toggle = screen.getByRole("button", { name: /menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking the toggle expands the mobile menu (nav carries is-open)", () => {
    renderNav();
    const toggle = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle.closest(".nav")).toHaveClass("is-open");
  });

  test("language toggle calls toggleLang and offers the other language's label", () => {
    const toggleLang = vi.fn();
    render(
      <MemoryRouter>
        <LanguageContext.Provider value={{ lang: "en", toggleLang }}>
          <HomeNav onLogin={() => {}} />
        </LanguageContext.Provider>
      </MemoryRouter>
    );
    const langButton = screen.getByRole("button", { name: /বাং/i });
    fireEvent.click(langButton);
    expect(toggleLang).toHaveBeenCalled();
  });
});
