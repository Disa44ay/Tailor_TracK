import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import HomePage from "./HomePage.jsx";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

function renderHomePage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders nav, hero, and how-it-works together", () => {
    renderHomePage();
    expect(screen.getAllByText(/log in/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /custom tailoring, made to your measure/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /how it works/i })).toBeInTheDocument();
  });

  test("clicking Book a consultation opens the auth modal, no page navigation", () => {
    renderHomePage();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /book a consultation/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
  });

  test("clicking the nav's Log in opens the same auth modal", () => {
    renderHomePage();
    fireEvent.click(screen.getAllByText(/log in/i)[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
