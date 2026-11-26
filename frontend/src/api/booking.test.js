import { describe, test, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "./client.js";
import { getEnquiry, adminStats, adminConfirm, adminSendMessage } from "./booking.js";

vi.mock("./client.js", () => ({ apiFetch: vi.fn() }));

describe("booking API helpers", () => {
  beforeEach(() => vi.mocked(apiFetch).mockReset());

  test("getEnquiry flattens the detail into one object", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      enquiry: { id: 7, status: "sent" },
      items: [{ id: 1, garment: "shirt" }],
      messages: [],
    });
    const e = await getEnquiry(7);
    expect(e).toEqual({ id: 7, status: "sent", items: [{ id: 1, garment: "shirt" }], messages: [] });
  });

  test("adminStats renames the garment and fabric rows for the charts", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      by_garment: [{ garment: "suit", count: 3 }],
      by_fabric_type: [{ fabric_type: "wool", count: 2 }],
      by_status: [],
    });
    expect(await adminStats()).toEqual({
      byGarment: [{ label: "suit", count: 3 }],
      byFabric: [{ label: "wool", count: 2 }],
    });
  });

  test("adminConfirm sends the date as an ISO string", async () => {
    vi.mocked(apiFetch).mockResolvedValue({});
    await adminConfirm(4, "2099-06-10T10:30");
    const body = JSON.parse(vi.mocked(apiFetch).mock.calls[0][1].body);
    expect(body.consultation_at).toBe(new Date("2099-06-10T10:30").toISOString());
  });

  test("adminSendMessage converts a proposed date and leaves a plain note alone", async () => {
    vi.mocked(apiFetch).mockResolvedValue({});
    await adminSendMessage(4, { kind: "date_proposal", proposed_at: "2099-06-10T10:30" });
    const dated = JSON.parse(vi.mocked(apiFetch).mock.calls[0][1].body);
    expect(dated.proposed_at).toBe(new Date("2099-06-10T10:30").toISOString());

    await adminSendMessage(4, { kind: "message", body: "Tuesday?" });
    const note = JSON.parse(vi.mocked(apiFetch).mock.calls[1][1].body);
    expect(note).toEqual({ kind: "message", body: "Tuesday?" });
  });
});
