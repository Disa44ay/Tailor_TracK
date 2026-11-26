import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookingForm from "./BookingForm.jsx";
import * as api from "../../api/booking.js";

describe("BookingForm", () => {
  test("pre-fills height, weight and age from the profile", async () => {
    vi.spyOn(api, "getProfile").mockResolvedValue({ height_cm: 175, weight_kg: 70, age: 30 });
    render(<BookingForm />);
    await waitFor(() => expect(screen.getByLabelText(/height/i)).toHaveValue(175));
    expect(screen.getByLabelText(/weight/i)).toHaveValue(70);
    expect(screen.getByLabelText(/age/i)).toHaveValue(30);
  });

  test("Add another adds a second garment block", () => {
    vi.spyOn(api, "getProfile").mockResolvedValue({});
    render(<BookingForm />);
    expect(screen.getAllByLabelText(/what you want/i)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /add another/i }));
    expect(screen.getAllByLabelText(/what you want/i)).toHaveLength(2);
  });

  test("submits every garment in one enquiry", async () => {
    vi.spyOn(api, "getProfile").mockResolvedValue({ height_cm: 175, weight_kg: 70, age: 30 });
    const create = vi.spyOn(api, "createEnquiry").mockResolvedValue({ enquiry: { id: 1 } });
    const message = vi.spyOn(api, "sendCustomerMessage").mockResolvedValue({});
    const onSubmitted = vi.fn();
    render(<BookingForm onSubmitted={onSubmitted} />);
    await waitFor(() => expect(screen.getByLabelText(/height/i)).toHaveValue(175));
    fireEvent.click(screen.getByRole("button", { name: /add another/i }));
    const fabrics = screen.getAllByLabelText(/fabric type/i);
    const colours = screen.getAllByLabelText(/fabric colour/i);
    fireEvent.change(fabrics[0], { target: { value: "Cotton" } });
    fireEvent.change(colours[0], { target: { value: "Navy" } });
    fireEvent.change(fabrics[1], { target: { value: "Linen" } });
    fireEvent.change(colours[1], { target: { value: "Cream" } });
    fireEvent.change(screen.getByLabelText(/preferred date/i), { target: { value: "2026-12-05T11:00" } });
    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(message).toHaveBeenCalledWith(1, expect.objectContaining({ kind: "date_request" }));
    const payload = create.mock.calls[0][0];
    expect(payload.items).toHaveLength(2);
    expect(payload.items[1]).toMatchObject({ fabricType: "Linen", fabricColour: "Cream" });
    expect(payload.height_cm).toBe(175);
  });
});

describe("BookingForm fields", () => {
  test("fabric type and colour are dropdowns and there is no fabric note", () => {
    vi.spyOn(api, "getProfile").mockResolvedValue({});
    render(<BookingForm />);
    const fabric = screen.getByLabelText(/fabric type/i);
    const colour = screen.getByLabelText(/fabric colour/i);
    expect(fabric.tagName).toBe("SELECT");
    expect(colour.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Linen" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Navy" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/fabric note/i)).toBeNull();
  });

  test("the preferred date is required before the enquiry can be sent", () => {
    vi.spyOn(api, "getProfile").mockResolvedValue({});
    render(<BookingForm />);
    expect(screen.getByLabelText(/preferred date/i)).toBeRequired();
  });
});
