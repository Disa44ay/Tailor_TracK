import { describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import NavBar from "./NavBar.jsx";

describe("NavBar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders nothing when logged out", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <NavBar />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  test("shows admin links for an admin and customer links are absent", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "admin" }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <NavBar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /order board/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reports/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /measurements/i })).not.toBeInTheDocument();
  });

  test("Log out clears the stored session", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <NavBar />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(localStorage.getItem("token")).toBeNull();
  });
});
