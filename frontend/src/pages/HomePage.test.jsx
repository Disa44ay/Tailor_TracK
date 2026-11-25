import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import { LanguageProvider } from "../app/LanguageContext.jsx";
import HomePage from "./HomePage.jsx";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

function renderHomePage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders nav, hero, and how-it-works in Bangla by default", () => {
    renderHomePage();
    expect(screen.getAllByText(/লগ ইন/).length).toBeGreaterThan(0);
    expect(screen.getByText(/সঠিক ফিট চান এমন পুরুষদের জন্য কাস্টম টেইলারিং/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "কীভাবে কাজ করে" })).toBeInTheDocument();
  });

  test("the language toggle switches the page to English", () => {
    renderHomePage();
    fireEvent.click(screen.getByRole("button", { name: /^EN$/ }));
    expect(screen.getByText(/custom tailoring for men who want it right/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /how it works/i })).toBeInTheDocument();
  });

  test("clicking Book a consultation opens the auth modal with both forms, no page navigation", () => {
    renderHomePage();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /পরামর্শের জন্য বুক করুন/ })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
  });

  test("clicking the nav's Log in opens the same auth modal", () => {
    renderHomePage();
    fireEvent.click(screen.getAllByText(/লগ ইন/)[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
