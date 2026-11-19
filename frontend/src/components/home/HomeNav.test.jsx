import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomeNav from "./HomeNav.jsx";

function renderNav() {
  return render(<MemoryRouter><HomeNav /></MemoryRouter>);
}

describe("HomeNav", () => {
  test("shows the brand mark and desktop links", () => {
    renderNav();
    expect(screen.getByText("TailorTrack")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute("href", "#how-it-works");
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  test("mobile menu toggle starts collapsed and exposes aria-expanded/aria-controls", () => {
    renderNav();
    const toggle = screen.getByRole("button", { name: /menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls");
  });

  test("clicking the toggle expands the mobile menu", () => {
    renderNav();
    const toggle = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const controlsId = toggle.getAttribute("aria-controls");
    expect(document.getElementById(controlsId)).toBeVisible();
  });
});
