import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./AdminLogin.jsx";
import * as api from "../api/booking.js";
import { AuthProvider } from "../app/AuthContext.jsx";

describe("AdminLogin", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("a successful studio login opens the dashboard and stores the studio session", async () => {
    vi.spyOn(api, "adminLogin").mockResolvedValue({ token: "a-token", user: { id: 2, name: "Studio", role: "admin" } });
    render(
      <MemoryRouter initialEntries={["/admin/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<div>dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(screen.getByText("dashboard")).toBeInTheDocument());
    expect(api.adminLogin).toHaveBeenCalledWith("admin@example.com", "secret");
    expect(localStorage.getItem("adminToken")).toBe("a-token");
    expect(localStorage.getItem("token")).toBeNull();
  });
});
