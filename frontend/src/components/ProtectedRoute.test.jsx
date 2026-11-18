import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function renderWithRole(userRole) {
  localStorage.setItem("token", "abc");
  localStorage.setItem("user", JSON.stringify({ id: 1, role: userRole }));

  return render(
    <MemoryRouter initialEntries={["/admin/orders"]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute role="admin">
                <div>admin board</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("sends a logged-in user with the wrong role to / rather than /login", () => {
    renderWithRole("customer");
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});
