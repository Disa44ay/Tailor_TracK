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

  test("clears the stored session and redirects to the homepage when an existing session expires (401 with a token)", async () => {
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
    expect(assignSpy).toHaveBeenCalledWith("/");
  });

  test("does not redirect on a 401 when there was no session to begin with (e.g. a failed login attempt)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "invalid credentials" }),
      })
    );
    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignSpy },
    });

    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toThrow();

    expect(assignSpy).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("invalid credentials");
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

describe("apiFetch session choice", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(toast, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("studio paths send the admin token, other paths the customer token", async () => {
    localStorage.setItem("token", "customer-token");
    localStorage.setItem("adminToken", "studio-token");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/admin/stats");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer studio-token");

    await apiFetch("/enquiries");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer customer-token");
  });

  test("a 401 on a studio path clears only the studio session", async () => {
    localStorage.setItem("token", "customer-token");
    localStorage.setItem("user", "{}");
    localStorage.setItem("adminToken", "studio-token");
    localStorage.setItem("adminUser", "{}");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: "expired" }) }));
    const assign = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, assign } });

    await expect(apiFetch("/admin/stats")).rejects.toThrow();
    expect(localStorage.getItem("adminToken")).toBeNull();
    expect(localStorage.getItem("token")).toBe("customer-token");
    expect(assign).toHaveBeenCalledWith("/admin/login");
  });
});
