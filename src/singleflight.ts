/**
 * Singleflight: collapse concurrent identical requests into a single in-flight
 * fetch. Keyed on a string the caller computes (typically `METHOD URL :: hash(body)`).
 *
 * Promises are shared across callers; if the underlying fetch rejects, every
 * waiter sees the same rejection. Successful results are not cached past the
 * resolution of the in-flight promise — see `cache.ts` for that.
 */

export class SingleFlight<T> {
  private readonly inflight = new Map<string, Promise<T>>();

  /**
   * If `key` is already in flight, returns the same promise. Otherwise calls
   * `fn`, stores its promise, and clears the entry when the promise settles.
   */
  do(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing !== undefined) return existing;

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, promise);
    return promise;
  }

  /** True if `key` currently has an in-flight call. */
  has(key: string): boolean {
    return this.inflight.has(key);
  }

  /** Number of in-flight calls. Useful for tests. */
  size(): number {
    return this.inflight.size;
  }
}

/**
 * Stable, side-effect-free key derivation for singleflight + cache. Sorts
 * object keys recursively before serializing so equivalent payloads produce
 * the same key regardless of insertion order.
 */
export function stableHash(value: unknown): string {
  return stringify(value);
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? `${value}` : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return `${value.toString()}n`;
  if (Array.isArray(value)) {
    return "[" + value.map(stringify).join(",") + "]";
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const entries = keys.map((k) => JSON.stringify(k) + ":" + stringify(obj[k]));
    return "{" + entries.join(",") + "}";
  }
  // function, symbol, etc. — collapse to a constant so they don't poison the key.
  return `"<${typeof value}>"`;
}
