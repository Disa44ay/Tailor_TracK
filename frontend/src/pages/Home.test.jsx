import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import Home from "./Home.jsx";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/orders" element={<div>my orders</div>} />
          <Route path="/admin/orders" element={<div>admin board</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders the public homepage for a logged-out visitor", () => {
    renderHome();
    expect(screen.getAllByText(/log in/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/you imagine it\. we tailor it/i)).toBeInTheDocument();
  });

  test("redirects a logged-in customer to /orders", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));
    renderHome();
    expect(screen.getByText("my orders")).toBeInTheDocument();
  });

  test("redirects a logged-in admin to /admin/orders", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "admin" }));
    renderHome();
    expect(screen.getByText("admin board")).toBeInTheDocument();
  });
});
