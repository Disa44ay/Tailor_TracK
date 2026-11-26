import { describe, test, expect } from "vitest";
import { dotFor } from "./InquiriesPanel.jsx";

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
