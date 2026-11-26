import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomeNav from './HomeNav.jsx';
 import { AuthProvider } from '../../app/AuthContext.jsx';

function renderNav(props = {}) {
  return render(<MemoryRouter><HomeNav onLogin={() => {}} {...props} /></MemoryRouter>);
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

  test("mobile menu toggle starts collapsed and expands on click", () => {
    renderNav();
    const toggle = screen.getByRole("button", { name: /menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle.closest(".nav")).toHaveClass("is-open");
  });

  test("signed-in visitors can log out from the nav", () => {
    localStorage.setItem("token", "t");
    localStorage.setItem("user", JSON.stringify({ id: 1, name: "Ada Lovelace", role: "customer" }));
    render(<MemoryRouter><AuthProvider><HomeNav onLogin={() => {}} /></AuthProvider></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    localStorage.clear();
  });
});
