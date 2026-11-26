import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function renderAt(path, role) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/admin/login" element={<div>studio login</div>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><div>dashboard</div></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><div>account</div></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("ProtectedRoute guards", () => {
  beforeEach(() => localStorage.clear());

  test("the studio route sends a visitor with no studio session to the studio login", () => {
    renderAt("/admin", "admin");
    expect(screen.getByText("studio login")).toBeInTheDocument();
  });

  test("a customer session does not open the studio route", () => {
    localStorage.setItem("token", "c");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));
    renderAt("/admin", "admin");
    expect(screen.getByText("studio login")).toBeInTheDocument();
  });

  test("the customer route sends a visitor with no customer session home", () => {
    renderAt("/account");
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  test("a signed-in customer reaches the customer route", () => {
    localStorage.setItem("token", "c");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));
    renderAt("/account");
    expect(screen.getByText("account")).toBeInTheDocument();
  });
});
