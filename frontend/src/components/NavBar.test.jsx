import { describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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

  test("shows the nav bar once logged in", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <NavBar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
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

  test("Log out returns to the homepage, not the separate /login page", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));

    render(
      <MemoryRouter initialEntries={["/some-page"]}>
        <AuthProvider>
          <Routes>
            <Route path="/some-page" element={<NavBar />} />
            <Route path="/" element={<div>homepage marker</div>} />
            <Route path="/login" element={<div>login page marker</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(screen.getByText("homepage marker")).toBeInTheDocument();
    expect(screen.queryByText("login page marker")).not.toBeInTheDocument();
  });
});
