import { describe, expect, it } from "vitest";
import { Paginator } from "../src/pagination.js";
import type { Page } from "../src/types.js";

describe("Paginator", () => {
  it("walks pages until next_cursor is null", async () => {
    const pages: Page<number>[] = [
      { items: [1, 2], nextCursor: "p2" },
      { items: [3, 4], nextCursor: "p3" },
      { items: [5], nextCursor: null },
    ];
    let i = 0;
    const paginator = new Paginator<number>((cursor) => {
      const page = pages[i++]!;
      if (i === 1) expect(cursor).toBeUndefined();
      else expect(cursor).toMatch(/^p[2-3]$/);
      return Promise.resolve(page);
    });

    const collected: number[] = [];
    for await (const p of paginator) collected.push(...p.items);
    expect(collected).toEqual([1, 2, 3, 4, 5]);
  });

  it(".all() collapses every page into a single array", async () => {
    const pages: Page<string>[] = [
      { items: ["a"], nextCursor: "x" },
      { items: ["b", "c"], nextCursor: null },
    ];
    let i = 0;
    const paginator = new Paginator<string>(() => Promise.resolve(pages[i++]!));
    expect(await paginator.all()).toEqual(["a", "b", "c"]);
  });

  it("propagates errors from the fetcher", async () => {
    const paginator = new Paginator<number>(() => Promise.reject(new Error("nope")));
    let errored = false;
    try {
      for await (const _p of paginator) {
        // unreachable
      }
    } catch (e) {
      errored = true;
      expect((e as Error).message).toBe("nope");
    }
    expect(errored).toBe(true);
  });
});
