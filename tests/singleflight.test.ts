import { describe, expect, it } from "vitest";
import { SingleFlight, stableHash } from "../src/singleflight.js";

describe("SingleFlight", () => {
  it("collapses concurrent calls with the same key", async () => {
    const sf = new SingleFlight<number>();
    let calls = 0;
    const fn = (): Promise<number> =>
      new Promise((resolve) => setTimeout(() => resolve(++calls), 10));

    const [a, b, c] = await Promise.all([
      sf.do("k", fn),
      sf.do("k", fn),
      sf.do("k", fn),
    ]);
    expect(calls).toBe(1);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(1);
  });

  it("does NOT collapse calls with different keys", async () => {
    const sf = new SingleFlight<string>();
    let counter = 0;
    const fn = (label: string): (() => Promise<string>) => () =>
      new Promise((r) => setTimeout(() => r(`${label}-${++counter}`), 5));

    const [a, b] = await Promise.all([
      sf.do("a", fn("A")),
      sf.do("b", fn("B")),
    ]);
    expect(a).toBe("A-1");
    expect(b).toBe("B-2");
  });

  it("clears the entry after rejection", async () => {
    const sf = new SingleFlight<number>();
    await expect(
      sf.do("k", () => Promise.reject(new Error("boom"))),
    ).rejects.toThrow("boom");
    expect(sf.has("k")).toBe(false);
    // A subsequent call with the same key starts fresh.
    const v = await sf.do("k", () => Promise.resolve(42));
    expect(v).toBe(42);
  });

  it("size reports in-flight count", async () => {
    const sf = new SingleFlight<void>();
    let resolveIt: (() => void) | undefined;
    const promise = sf.do("x", () => new Promise<void>((r) => (resolveIt = r)));
    expect(sf.size()).toBe(1);
    resolveIt!();
    await promise;
    expect(sf.size()).toBe(0);
  });
});

describe("stableHash", () => {
  it("returns the same string for objects with different key order", () => {
    expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }));
  });

  it("produces distinct strings for distinct values", () => {
    expect(stableHash({ a: 1 })).not.toBe(stableHash({ a: 2 }));
    expect(stableHash([1, 2])).not.toBe(stableHash([2, 1]));
  });

  it("handles primitives and nullish", () => {
    expect(stableHash(null)).toBe("null");
    expect(stableHash(undefined)).toBe("null");
    expect(stableHash(0)).toBe("0");
    expect(stableHash("hi")).toBe('"hi"');
  });
});
