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

  test("clears the stored session and redirects to /login on a 401 response", async () => {
    localStorage.setItem("token", "stale-token");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "customer" }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "jwt expired" }),
      })
    );
    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignSpy },
    });

    await expect(apiFetch("/orders")).rejects.toThrow();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(assignSpy).toHaveBeenCalledWith("/login");
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
