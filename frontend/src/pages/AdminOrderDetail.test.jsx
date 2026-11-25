import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminOrderDetail from "./AdminOrderDetail.jsx";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../api/client.js";

function renderAt(order) {
  apiFetch.mockImplementation((path) => {
    if (path === "/admin/orders") return Promise.resolve([order]);
    return Promise.resolve({});
  });
  return render(
    <MemoryRouter initialEntries={["/admin/orders/5"]}>
      <Routes>
        <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminOrderDetail", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test("shows the order's notes, priority and fabric note so the admin isn't quoting blind", async () => {
    renderAt({
      id: 5,
      garment_type: "shirt",
      status: "requested",
      customer_id: 1,
      style_notes: "slightly loose collar",
      fabric_note: "customer's own cotton fabric",
      priority: "urgent",
    });

    expect(await screen.findByText(/slightly loose collar/i)).toBeInTheDocument();
    expect(screen.getByText(/customer's own cotton fabric/i)).toBeInTheDocument();
    expect(screen.getByText(/urgent/i)).toBeInTheDocument();
  });

  test("on a 'requested' order shows Reject (with a reason field) and Accept actions", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "requested", customer_id: 1 });

    expect(await screen.findByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
  });

  test("clicking Accept calls PATCH /admin/orders/:id/accept with no body, then reloads the order", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "requested", customer_id: 1 });
    await screen.findByRole("button", { name: /accept/i });

    fireEvent.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/admin/orders/5/accept", expect.objectContaining({ method: "PATCH" }));
    });
    const acceptCall = apiFetch.mock.calls.find(([path]) => path === "/admin/orders/5/accept");
    expect(acceptCall[1].body).toBeUndefined();
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/admin/orders");
    });
  });

  test("on a 'confirmed' order shows only the single valid next-stage button ('Cutting')", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "confirmed", customer_id: 1 });

    expect(await screen.findByRole("button", { name: /^cutting$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /stitching/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^ready$/i })).not.toBeInTheDocument();
  });

  test("includes a manual balance-payment form and a custom-notification composer", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "confirmed", customer_id: 1 });

    await screen.findByRole("button", { name: /^cutting$/i });
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /record payment/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });
});
