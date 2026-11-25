import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Measurements from "./Measurements.jsx";
import { getBodyProfileMock, setBodyProfileMock } from "./bodyProfileMock.js";

vi.mock("../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../api/client.js";

describe("Measurements — body profile fields", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    localStorage.clear();
  });

  test("renders height, weight and age alongside the existing fields", async () => {
    apiFetch.mockResolvedValue({});
    render(<Measurements />);

    expect(await screen.findByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^chest$/i)).toBeInTheDocument();
  });

  test("submits height, weight and age in the PUT body alongside the other fields", async () => {
    apiFetch.mockResolvedValue({});
    render(<Measurements />);

    await screen.findByLabelText(/height/i);
    fireEvent.change(screen.getByLabelText(/height/i), { target: { value: "178" } });
    fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: "72" } });
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: "29" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const putCall = apiFetch.mock.calls.find(([, opts]) => opts?.method === "PUT");
      expect(putCall).toBeTruthy();
      const body = JSON.parse(putCall[1].body);
      expect(body.heightCm).toBe(178);
      expect(body.weightKg).toBe(72);
      expect(body.age).toBe(29);
    });
  });

  test("saves height/weight/age to the local mock on submit, as a fallback for an environment whose DB migration hasn't run", async () => {
    apiFetch.mockResolvedValue({});
    render(<Measurements />);

    await screen.findByLabelText(/height/i);
    fireEvent.change(screen.getByLabelText(/height/i), { target: { value: "178" } });
    fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: "72" } });
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: "29" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(getBodyProfileMock()).toEqual({ heightCm: 178, weightKg: 72, age: 29 });
    });
  });

  test("falls back to the locally mocked values when the backend doesn't return them", async () => {
    setBodyProfileMock({ heightCm: 165, weightKg: 58, age: 34 });
    apiFetch.mockResolvedValue({ chest: 40 });

    render(<Measurements />);

    expect(await screen.findByLabelText(/height/i)).toHaveValue(165);
    expect(screen.getByLabelText(/weight/i)).toHaveValue(58);
    expect(screen.getByLabelText(/age/i)).toHaveValue(34);
    expect(screen.getByLabelText(/^chest$/i)).toHaveValue(40);
  });

  test("preserves previously mocked height/weight/age when only an unrelated field is edited", async () => {
    setBodyProfileMock({ heightCm: 178, weightKg: 72, age: 29 });
    apiFetch.mockResolvedValue({});

    render(<Measurements />);

    await screen.findByLabelText(/height/i);
    fireEvent.change(screen.getByLabelText(/^chest$/i), { target: { value: "41" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const putCall = apiFetch.mock.calls.find(([, opts]) => opts?.method === "PUT");
      expect(putCall).toBeTruthy();
    });
    expect(getBodyProfileMock()).toEqual({ heightCm: 178, weightKg: 72, age: 29 });
  });

  test("does not overwrite the mock when the PUT request fails", async () => {
    setBodyProfileMock({ heightCm: 178, weightKg: 72, age: 29 });
    apiFetch.mockRejectedValue(new Error("network error"));

    render(<Measurements />);

    await screen.findByLabelText(/height/i);
    fireEvent.change(screen.getByLabelText(/height/i), { target: { value: "190" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalled();
    });
    expect(getBodyProfileMock()).toEqual({ heightCm: 178, weightKg: 72, age: 29 });
  });
});
