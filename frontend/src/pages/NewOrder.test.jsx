import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NewOrder from "./NewOrder.jsx";
import { MEASUREMENT_FIELDS_BY_GARMENT } from "../components/order/measurementFieldsByGarment.js";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("../components/order/sketch/exportSketchPng.js", () => ({
  exportSketchPng: vi.fn(() => Promise.resolve()),
}));

import { apiFetch } from "../api/client.js";
import { exportSketchPng } from "../components/order/sketch/exportSketchPng.js";

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

describe("NewOrder — live customization flow", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({});
    exportSketchPng.mockClear();
  });

  test("selecting a dress type narrows the fit options shown", () => {
    renderNewOrder();
    expect(screen.getByRole("button", { name: "Italian" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pant" }));

    expect(screen.queryByRole("button", { name: "Italian" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Slim" })).toBeInTheDocument();
  });

  test("switching dress type after a fit was picked clears the fit selection", () => {
    renderNewOrder();
    fireEvent.click(screen.getByRole("button", { name: "Italian" }));
    expect(screen.getByRole("button", { name: "Italian" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Pant" }));
    fireEvent.click(screen.getByRole("button", { name: "Shirt" }));

    expect(screen.getByRole("button", { name: "Italian" })).toHaveAttribute("aria-pressed", "false");
  });

  test("the measurement fields shown change with dress type", () => {
    renderNewOrder();
    expect(screen.getByLabelText("Chest")).toBeInTheDocument();
    expect(screen.queryByLabelText("Thigh")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pant" }));

    expect(screen.getByLabelText("Thigh")).toBeInTheDocument();
    expect(screen.queryByLabelText("Chest")).not.toBeInTheDocument();
  });

  test("Save measurements sends only the selected dress type's fields (plus body stats)", async () => {
    renderNewOrder();
    fireEvent.click(screen.getByRole("button", { name: "Pant" }));
    fireEvent.change(screen.getByLabelText("Waist"), { target: { value: "32" } });
    fireEvent.click(screen.getByRole("button", { name: /save measurements/i }));

    await waitFor(() => {
      const putCall = apiFetch.mock.calls.find(
        ([path, opts]) => path === "/me/measurements" && opts?.method === "PUT"
      );
      expect(putCall).toBeTruthy();
      const body = JSON.parse(putCall[1].body);
      expect(Object.keys(body).sort()).toEqual(
        [...MEASUREMENT_FIELDS_BY_GARMENT.pant, "heightCm", "weightKg", "age"].sort()
      );
      expect(body.waist).toBe(32);
    });
  });

  test("submitting saves any typed-but-unsaved measurements before posting the order", async () => {
    renderNewOrder();
    fireEvent.click(screen.getByRole("button", { name: "Pant" }));
    fireEvent.change(screen.getByLabelText("Waist"), { target: { value: "32" } });
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => {
      const putIndex = apiFetch.mock.calls.findIndex(
        ([path, opts]) => path === "/me/measurements" && opts?.method === "PUT"
      );
      const postIndex = apiFetch.mock.calls.findIndex(([path]) => path === "/orders");
      expect(putIndex).toBeGreaterThanOrEqual(0);
      expect(postIndex).toBeGreaterThan(putIndex);
      const body = JSON.parse(apiFetch.mock.calls[putIndex][1].body);
      expect(body.waist).toBe(32);
    });
  });

  test("Save design as PNG calls exportSketchPng with only the current dress type's fields", async () => {
    renderNewOrder();
    fireEvent.click(screen.getByRole("button", { name: "Pant" }));
    fireEvent.change(screen.getByLabelText("Waist"), { target: { value: "32" } });
    fireEvent.click(screen.getByRole("button", { name: /save design as png/i }));

    await waitFor(() => {
      expect(exportSketchPng).toHaveBeenCalled();
      const [, measurements] = exportSketchPng.mock.calls[0];
      expect(Object.keys(measurements).sort()).toEqual([...MEASUREMENT_FIELDS_BY_GARMENT.pant].sort());
      expect(measurements.waist).toBe(32);
    });
  });
});
