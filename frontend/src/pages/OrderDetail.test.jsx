import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OrderDetail from "./OrderDetail.jsx";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../api/client.js";

function renderAt(order) {
  apiFetch.mockImplementation((path) => {
    if (path === "/orders/5") return Promise.resolve(order);
    return Promise.resolve({});
  });
  return render(
    <MemoryRouter initialEntries={["/orders/5"]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("OrderDetail", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test("shows Confirm/Decline buttons only when status is 'quoted'", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "quoted", due_date: "2026-12-01", quoted_price: 1000, advance_required: 300 });

    expect(await screen.findByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  test("does not show Confirm/Decline buttons when status is not 'quoted'", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "requested" });

    await screen.findByText(/shirt/i);
    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /decline/i })).not.toBeInTheDocument();
  });

  test("shows an editable form only when status is 'needs_changes'", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "needs_changes", style_notes: "", fabric_note: "", priority: "normal" });

    expect(await screen.findByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/style notes/i)).toBeInTheDocument();
  });

  test("clicking Confirm calls POST /orders/:id/confirm and redirects to the returned gatewayUrl", async () => {
    renderAt({ id: 5, garment_type: "shirt", status: "quoted", due_date: "2026-12-01", quoted_price: 1000, advance_required: 300 });
    apiFetch.mockImplementation((path) => {
      if (path === "/orders/5") return Promise.resolve({ id: 5, garment_type: "shirt", status: "quoted", due_date: "2026-12-01", quoted_price: 1000, advance_required: 300 });
      if (path === "/orders/5/confirm") return Promise.resolve({ gatewayUrl: "https://sandbox.sslcommerz.com/pay/abc" });
      return Promise.resolve({});
    });
    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignSpy },
    });

    fireEvent.click(await screen.findByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith("https://sandbox.sslcommerz.com/pay/abc");
    });
    expect(apiFetch).toHaveBeenCalledWith("/orders/5/confirm", expect.objectContaining({ method: "POST" }));
  });
});
