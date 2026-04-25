import { describe, expect, it, vi } from "vitest";
import {
  computeBackoff,
  isRetryableStatus,
  parseRetryAfter,
  sleep,
} from "../src/retry.js";

describe("parseRetryAfter", () => {
  it("returns null for missing or empty header", () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter(undefined)).toBeNull();
    expect(parseRetryAfter("")).toBeNull();
    expect(parseRetryAfter("   ")).toBeNull();
  });

  it("parses delta-seconds as ms", () => {
    expect(parseRetryAfter("0")).toBe(0);
    expect(parseRetryAfter("5")).toBe(5_000);
    expect(parseRetryAfter("60")).toBe(60_000);
    expect(parseRetryAfter("0.5")).toBe(500);
  });

  it("parses HTTP-date relative to `now`", () => {
    const now = Date.parse("2026-04-24T12:00:00Z");
    const future = "Fri, 24 Apr 2026 12:00:30 GMT";
    expect(parseRetryAfter(future, now)).toBe(30_000);
  });

  it("clamps past dates to 0", () => {
    const now = Date.parse("2026-04-24T12:00:00Z");
    const past = "Fri, 24 Apr 2026 11:59:30 GMT";
    expect(parseRetryAfter(past, now)).toBe(0);
  });

  it("returns null on garbage", () => {
    expect(parseRetryAfter("nope")).toBeNull();
    expect(parseRetryAfter("not-a-date")).toBeNull();
  });
});

describe("computeBackoff", () => {
  it("never exceeds maxBackoff", () => {
    const max = 1_000;
    for (let i = 0; i < 50; i++) {
      const result = computeBackoff(20, 100, max);
      expect(result).toBeLessThanOrEqual(max);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns 0 for negative attempts", () => {
    expect(computeBackoff(-1, 100, 1_000)).toBe(0);
  });

  it("expands exponentially before the cap", () => {
    // We can't assert exact values (jitter), but we can assert the upper bound
    // doubles per attempt up to the cap.
    const initial = 100;
    const cap = 100_000;
    const samples = (attempt: number): number =>
      Math.max(...Array.from({ length: 200 }, () => computeBackoff(attempt, initial, cap)));
    expect(samples(0)).toBeLessThanOrEqual(initial);
    expect(samples(1)).toBeLessThanOrEqual(2 * initial);
    expect(samples(2)).toBeLessThanOrEqual(4 * initial);
  });
});

describe("isRetryableStatus", () => {
  it("retries 408/429/502/503/504", () => {
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
  });

  it("does NOT retry 4xx other than 408/429", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });

  it("does NOT retry 200/201", () => {
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(201)).toBe(false);
  });
});

describe("sleep", () => {
  it("resolves after `ms`", async () => {
    const start = Date.now();
    await sleep(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });

  it("resolves immediately for 0/negative", async () => {
    const start = Date.now();
    await sleep(0);
    await sleep(-10);
    expect(Date.now() - start).toBeLessThan(10);
  });

  it("rejects on abort", async () => {
    const ctrl = new AbortController();
    const promise = sleep(10_000, ctrl.signal);
    setTimeout(() => ctrl.abort(new Error("nope")), 5);
    await expect(promise).rejects.toThrow();
  });

  it("rejects immediately when already aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort(new Error("pre-aborted"));
    await expect(sleep(10_000, ctrl.signal)).rejects.toThrow();
    // and the timer is not pending
    vi.useFakeTimers();
    vi.runAllTimers();
    vi.useRealTimers();
  });
});
