import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { retryOnce } from "./retryOnce.js";

describe("retryOnce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("retries a failed photo once, with a cache-busting query", () => {
    const img = { src: "https://i.ibb.co.com/x/photo.jpg", dataset: {} };
    retryOnce({ currentTarget: img });
    vi.advanceTimersByTime(800);
    expect(img.src).toBe("https://i.ibb.co.com/x/photo.jpg?retry=1");
  });

  test("a second failure does not schedule another retry", () => {
    const img = { src: "https://i.ibb.co.com/x/photo.jpg", dataset: {} };
    retryOnce({ currentTarget: img });
    retryOnce({ currentTarget: img });
    vi.advanceTimersByTime(800);
    expect(img.src).toBe("https://i.ibb.co.com/x/photo.jpg?retry=1");
  });
});
