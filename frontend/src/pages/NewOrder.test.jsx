import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NewOrder from "./NewOrder.jsx";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../api/client.js";

function renderNewOrder() {
  return render(
    <MemoryRouter>
      <NewOrder />
    </MemoryRouter>
  );
}

describe("NewOrder — fabric preview", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({});
  });

  test("renders the fabric picker and a default sketch preview", () => {
    renderNewOrder();
    expect(screen.getByText("Oxford Blue")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /shirt sketch/i })).toBeInTheDocument();
  });

  test("selecting a fabric updates the sketch preview", () => {
    renderNewOrder();
    fireEvent.click(screen.getByRole("button", { name: /ivory silk/i }));
    expect(screen.getByRole("img", { name: /shirt sketch, silk solid fabric/i })).toBeInTheDocument();
  });

  test("moving the fit slider updates the displayed fit", () => {
    renderNewOrder();
    const slider = screen.getByLabelText(/fit/i);
    fireEvent.change(slider, { target: { value: "1" } });
    expect(slider).toHaveValue("1");
  });

  test("submits the selected fabricId alongside the other order fields", async () => {
    renderNewOrder();
    fireEvent.click(screen.getByRole("button", { name: /ivory silk/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => {
      const postCall = apiFetch.mock.calls.find(([path]) => path === "/orders");
      expect(postCall).toBeTruthy();
      const body = JSON.parse(postCall[1].body);
      expect(body.fabricId).toBe(2);
    });
  });

  test("submits without a fabricId when no fabric is selected", async () => {
    renderNewOrder();
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => {
      const postCall = apiFetch.mock.calls.find(([path]) => path === "/orders");
      expect(postCall).toBeTruthy();
      const body = JSON.parse(postCall[1].body);
      expect(body.fabricId).toBeUndefined();
    });
  });
});
