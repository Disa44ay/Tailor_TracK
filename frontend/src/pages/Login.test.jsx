import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import Login from "./Login.jsx";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../api/client.js";

describe("Login", () => {
  beforeEach(() => {
    localStorage.clear();
    apiFetch.mockReset();
  });

  test("submitting the login form calls apiFetch and stores the returned token", async () => {
    apiFetch.mockResolvedValue({
      token: "abc",
      user: { id: 1, name: "Rafi", role: "customer" },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "rafi@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("abc");
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "rafi@example.com", password: "secret123" }),
      })
    );
  });
});
