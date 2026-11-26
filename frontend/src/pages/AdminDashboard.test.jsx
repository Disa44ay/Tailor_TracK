import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import { AuthProvider } from "../app/AuthContext.jsx";
import * as api from "../api/booking.js";

const pendingRows = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: 100 + i,
    customer_name: `Customer ${i + 1}`,
    status: "sent",
    created_at: `2026-01-${String(20 - i).padStart(2, "0")}T10:00:00.000Z`,
  }));

function detail({ requested = null } = {}) {
  return {
    id: 100,
    status: "sent",
    height_cm: 175,
    weight_kg: 70,
    age: 28,
    items: [{ id: 1, garment: "shirt", fabric_type: "cotton", fabric_colour: "navy" }],
    messages: requested
      ? [{ id: 9, sender: "customer", kind: "date_request", proposed_at: requested, created_at: requested }]
      : [],
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <AuthProvider>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<div>studio login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function mockData({ pending = [], detailValue = detail() } = {}) {
  vi.spyOn(api, "adminCustomers").mockResolvedValue([{ name: "Ada", email: "ada@example.com", consultations: 2 }]);
  vi.spyOn(api, "adminEnquiries").mockImplementation(async (status) => {
    if (status === "sent") return pending;
    return [];
  });
  vi.spyOn(api, "adminStats").mockResolvedValue({ byGarment: [], byFabric: [] });
  vi.spyOn(api, "adminEnquiry").mockResolvedValue(detailValue);
}

describe("AdminDashboard lists", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("shows five pending rows, then See more once, and reveals the rest", async () => {
    mockData({ pending: pendingRows(7) });
    renderDashboard();
    const panel = await screen.findByRole("region", { name: "Pending consultations" });
    await waitFor(() => expect(within(panel).getAllByRole("button").filter((b) => b.className.includes("admin__row"))).toHaveLength(5));

    const more = within(panel).getByRole("button", { name: "See more" });
    expect(more.textContent).toBe("See more");
    fireEvent.click(more);
    expect(within(panel).getAllByRole("button").filter((b) => b.className.includes("admin__row"))).toHaveLength(7);
    expect(within(panel).queryByRole("button", { name: "See more" })).toBeNull();
  });

  test("no See more button when the list fits", async () => {
    mockData({ pending: pendingRows(3) });
    renderDashboard();
    await screen.findByText("Customer 3");
    expect(screen.queryByRole("button", { name: "See more" })).toBeNull();
  });
});

describe("AdminDashboard actions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("Accept stays disabled until the customer has asked for a date", async () => {
    mockData({ pending: pendingRows(1), detailValue: detail() });
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: /customer 1/i }));
    expect(await screen.findByText("No date requested yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept this date" })).toBeDisabled();
  });

  test("Accept confirms the date the customer asked for", async () => {
    const requested = "2099-06-10T10:30:00.000Z";
    mockData({ pending: pendingRows(1), detailValue: detail({ requested }) });
    const confirm = vi.spyOn(api, "adminConfirm").mockResolvedValue({});
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: /customer 1/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Accept this date" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(100, requested));
  });

  test("a note goes to the customer as a plain message", async () => {
    mockData({ pending: pendingRows(1), detailValue: detail() });
    const send = vi.spyOn(api, "adminSendMessage").mockResolvedValue({});
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: /customer 1/i }));
    fireEvent.change(await screen.findByLabelText(/send a note/i), { target: { value: "Tuesday at 10?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send note" }));
    await waitFor(() => expect(send).toHaveBeenCalledWith(100, { kind: "message", body: "Tuesday at 10?" }));
  });

  test("Log out clears only the studio session and goes to the studio login", async () => {
    mockData();
    localStorage.setItem("adminToken", "a");
    localStorage.setItem("adminUser", JSON.stringify({ id: 2, role: "admin" }));
    localStorage.setItem("token", "c");
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: "Log out" }));
    expect(await screen.findByText("studio login")).toBeInTheDocument();
    expect(localStorage.getItem("adminToken")).toBeNull();
    expect(localStorage.getItem("token")).toBe("c");
  });
});
