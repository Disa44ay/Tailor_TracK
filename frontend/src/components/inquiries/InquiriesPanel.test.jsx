import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InquiriesPanel, { dotFor } from "./InquiriesPanel.jsx";

describe("dotFor", () => {
  test("red when the admin has replied and it is unread", () => {
    expect(dotFor({ status: "in_conversation", unread: true })).toBe("red");
  });
  test("blue when the enquiry was sent and nothing has come back", () => {
    expect(dotFor({ status: "sent", unread: false })).toBe("blue");
  });
  test("no dot once confirmed and read", () => {
    expect(dotFor({ status: "confirmed", unread: false })).toBeNull();
  });
});

describe("InquiriesPanel empty state", () => {
  test("offers a booking when the customer has no enquiries", async () => {
    const api = await import("../../api/booking.js");
    vi.spyOn(api, "listEnquiries").mockResolvedValue([]);
    const onBook = vi.fn();
    render(<InquiriesPanel onBook={onBook} />);
    fireEvent.click(await screen.findByRole("button", { name: /book a consultation/i }));
    expect(onBook).toHaveBeenCalled();
  });
});
