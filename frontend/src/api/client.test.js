import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import toast from "react-hot-toast";
import { apiFetch } from "./client.js";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(toast, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("shows a toast and rethrows on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: "Bad request" }),
      })
    );

    await expect(apiFetch("/orders")).rejects.toThrow("Bad request");
    expect(toast.error).toHaveBeenCalledWith("Bad request");
  });

  test("shows a generic toast and rethrows on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(apiFetch("/orders")).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  test("attaches the stored JWT as an Authorization header when present", async () => {
    localStorage.setItem("token", "abc123");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/orders");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer abc123");
  });
});
