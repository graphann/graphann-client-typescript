/**
 * Async-iterator helper for cursor-paginated endpoints.
 *
 * Usage:
 * ```ts
 * for await (const page of client.listDocuments({ indexId: "..." })) {
 *   for (const doc of page.items) console.log(doc.id);
 * }
 * ```
 *
 * The fetcher returns `{ items, nextCursor }` per page. Iteration stops when
 * `nextCursor` is `null`. The iterator is single-pass — re-iterating a paginator
 * starts a new sequence.
 */

import type { Page } from "./types.js";

export type PageFetcher<T> = (cursor: string | undefined, signal?: AbortSignal) => Promise<Page<T>>;

export class Paginator<T> implements AsyncIterable<Page<T>> {
  constructor(
    private readonly fetcher: PageFetcher<T>,
    private readonly signal?: AbortSignal,
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<Page<T>> {
    let cursor: string | undefined;
    let done = false;
    const fetcher = this.fetcher;
    const signal = this.signal;

    return {
      next: async (): Promise<IteratorResult<Page<T>>> => {
        if (done) return { done: true, value: undefined };
        const page = await fetcher(cursor, signal);
        if (page.nextCursor === null || page.nextCursor === undefined) {
          done = true;
        } else {
          cursor = page.nextCursor;
        }
        return { done: false, value: page };
      },
    };
  }

  /** Convenience: collapse all pages into a single array. */
  async all(): Promise<T[]> {
    const out: T[] = [];
    for await (const page of this) out.push(...page.items);
    return out;
  }
}
