import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyOrders from "./MyOrders.jsx";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../api/client.js";

describe("MyOrders", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test("renders each order's garment type and status badge", async () => {
    apiFetch.mockResolvedValue([
      { id: 1, garment_type: "shirt", status: "requested" },
      { id: 2, garment_type: "pant", status: "quoted" },
    ]);

    render(
      <MemoryRouter>
        <MyOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText(/shirt/i)).toBeInTheDocument();
    expect(await screen.findByText(/pant/i)).toBeInTheDocument();
    expect(screen.getByText("requested")).toBeInTheDocument();
    expect(screen.getByText("quoted")).toBeInTheDocument();
  });
});
