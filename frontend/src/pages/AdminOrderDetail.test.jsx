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

  test("on a 'requested' order shows Reject (with a reason field) and Quote (due date/price/advance fields) actions", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "requested", customer_id: 1 });

    expect(await screen.findByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quoted price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/advance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send quote/i })).toBeInTheDocument();
  });

  test("submitting Quote calls PATCH /admin/orders/:id/quote with the three fields", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "requested", customer_id: 1 });
    await screen.findByLabelText(/due date/i);

    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText(/quoted price/i), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText(/advance/i), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: /send quote/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/admin/orders/5/quote",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ dueDate: "2026-12-01", quotedPrice: 1000, advanceRequired: 300 }),
        })
      );
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
