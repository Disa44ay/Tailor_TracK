import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InquiriesPanel from "./InquiriesPanel.jsx";
import * as api from "../../api/booking.js";

const row = { id: 31, status: "sent", garments: "shirt, suit", requested_at: "2099-06-10T10:30:00.000Z", unread: false };
const full = {
  id: 31,
  status: "sent",
  created_at: "2026-01-02T09:00:00.000Z",
  consultation_at: null,
  items: [
    { id: 1, garment: "shirt", fabric_type: "cotton", fabric_colour: "navy" },
    { id: 2, garment: "suit", fabric_type: "wool", fabric_colour: "charcoal" },
  ],
  messages: [{ id: 5, sender: "customer", kind: "date_request", proposed_at: row.requested_at, created_at: row.requested_at }],
};

describe("InquiriesPanel list and detail", () => {
  beforeEach(() => vi.restoreAllMocks());

  test("a row names the garments, the status and the requested date", async () => {
    vi.spyOn(api, "listEnquiries").mockResolvedValue([row]);
    render(<InquiriesPanel />);
    expect(await screen.findByText("Shirt, suit")).toBeInTheDocument();
    expect(screen.getByText("Waiting for the studio")).toBeInTheDocument();
  });

  test("the detail shows the next step, the garments and the requested date", async () => {
    vi.spyOn(api, "listEnquiries").mockResolvedValue([row]);
    vi.spyOn(api, "getEnquiry").mockResolvedValue(full);
    vi.spyOn(api, "markEnquirySeen").mockResolvedValue({});
    render(<InquiriesPanel />);
    fireEvent.click(await screen.findByRole("button", { name: /shirt, suit/i }));
    expect(await screen.findByText(/the studio reviews each request/i)).toBeInTheDocument();
    expect(screen.getByText("Shirt: cotton, navy")).toBeInTheDocument();
    expect(screen.getByText("Suit: wool, charcoal")).toBeInTheDocument();
    expect(screen.getAllByText(/jun 10, 2099/i).length).toBeGreaterThan(0);
  });

  test("asking for a different date sends a date request and confirms it", async () => {
    vi.spyOn(api, "listEnquiries").mockResolvedValue([row]);
    vi.spyOn(api, "getEnquiry").mockResolvedValue(full);
    vi.spyOn(api, "markEnquirySeen").mockResolvedValue({});
    const send = vi.spyOn(api, "sendCustomerMessage").mockResolvedValue({});
    render(<InquiriesPanel />);
    fireEvent.click(await screen.findByRole("button", { name: /shirt, suit/i }));
    fireEvent.change(await screen.findByLabelText(/new date and time/i), { target: { value: "2099-07-01T09:00" } });
    fireEvent.click(screen.getByRole("button", { name: /send request/i }));
    await waitFor(() => expect(send).toHaveBeenCalledWith(31, { kind: "date_request", proposed_at: "2099-07-01T09:00" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/request sent/i);
  });

  test("a failed load shows the error and a Try again button", async () => {
    vi.spyOn(api, "listEnquiries").mockRejectedValue(new Error("offline"));
    render(<InquiriesPanel />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not load/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
