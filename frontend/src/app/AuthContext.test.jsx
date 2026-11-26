import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { apiFetch } from "../api/client.js";

vi.mock("../api/client.js", () => ({ apiFetch: vi.fn() }));

// Shows the session values and exposes buttons that call the context actions.
function Probe() {
  const a = useAuth();
  return (
    <div>
      <p data-testid="customer">{a.user?.name ?? "none"}</p>
      <p data-testid="studio">{a.adminUser?.name ?? "none"}</p>
      <button onClick={() => a.login("c@example.com", "pw")}>customer login</button>
      <button onClick={() => a.login("admin@example.com", "pw")}>studio login</button>
      <button onClick={() => a.logout()}>customer logout</button>
      <button onClick={() => a.logoutAdmin()}>studio logout</button>
    </div>
  );
}

function renderProbe() {
  return render(<AuthProvider><Probe /></AuthProvider>);
}

describe("AuthProvider sessions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiFetch).mockReset();
  });

  test("a customer login fills only the customer session", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ token: "c-token", user: { id: 1, name: "Ada", role: "customer" } });
    renderProbe();
    fireEvent.click(screen.getByText("customer login"));
    await waitFor(() => expect(screen.getByTestId("customer")).toHaveTextContent("Ada"));
    expect(localStorage.getItem("token")).toBe("c-token");
    expect(localStorage.getItem("adminToken")).toBeNull();
  });

  test("a studio login goes to the studio session even through the customer form", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ token: "a-token", user: { id: 2, name: "Studio", role: "admin" } });
    renderProbe();
    fireEvent.click(screen.getByText("studio login"));
    await waitFor(() => expect(screen.getByTestId("studio")).toHaveTextContent("Studio"));
    expect(localStorage.getItem("adminToken")).toBe("a-token");
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("logging out the customer leaves the studio session in place", async () => {
    localStorage.setItem("token", "c-token");
    localStorage.setItem("user", JSON.stringify({ id: 1, name: "Ada", role: "customer" }));
    localStorage.setItem("adminToken", "a-token");
    localStorage.setItem("adminUser", JSON.stringify({ id: 2, name: "Studio", role: "admin" }));
    renderProbe();
    expect(screen.getByTestId("customer")).toHaveTextContent("Ada");
    expect(screen.getByTestId("studio")).toHaveTextContent("Studio");

    fireEvent.click(screen.getByText("customer logout"));
    expect(screen.getByTestId("customer")).toHaveTextContent("none");
    expect(screen.getByTestId("studio")).toHaveTextContent("Studio");
    expect(localStorage.getItem("adminToken")).toBe("a-token");
  });

  test("logging out the studio leaves the customer session in place", () => {
    localStorage.setItem("token", "c-token");
    localStorage.setItem("user", JSON.stringify({ id: 1, name: "Ada", role: "customer" }));
    localStorage.setItem("adminToken", "a-token");
    localStorage.setItem("adminUser", JSON.stringify({ id: 2, name: "Studio", role: "admin" }));
    renderProbe();
    fireEvent.click(screen.getByText("studio logout"));
    expect(screen.getByTestId("studio")).toHaveTextContent("none");
    expect(screen.getByTestId("customer")).toHaveTextContent("Ada");
    expect(localStorage.getItem("token")).toBe("c-token");
  });
});
