/**
 * Retry policy: exponential backoff with full jitter, plus Retry-After
 * deference (delta-seconds OR HTTP-date). Pure functions — no side effects.
 */

/** Compute delay (ms) for the Nth retry. Caps at `maxBackoff`. */
export function computeBackoff(attempt: number, initial: number, maxBackoff: number): number {
  if (attempt < 0) return 0;
  const expo = Math.min(maxBackoff, initial * Math.pow(2, attempt));
  // Full jitter: random [0, expo]
  return Math.floor(Math.random() * expo);
}

/**
 * Parse a Retry-After header value into milliseconds. Returns `null` when the
 * header is absent or unparseable.
 *
 * Accepts:
 *   - delta-seconds (e.g. `"30"`)
 *   - HTTP-date (e.g. `"Wed, 21 Oct 2026 07:28:00 GMT"`)
 */
export function parseRetryAfter(header: string | null | undefined, now: number = Date.now()): number | null {
  if (header === null || header === undefined) return null;
  const trimmed = header.trim();
  if (trimmed.length === 0) return null;

  // Case 1: delta-seconds.
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const seconds = Number.parseFloat(trimmed);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.floor(seconds * 1000);
    }
    return null;
  }

  // Case 2: HTTP-date.
  const ts = Date.parse(trimmed);
  if (Number.isFinite(ts)) {
    return Math.max(0, ts - now);
  }
  return null;
}

/** True if the status code is one we should retry on. */
export function isRetryableStatus(status: number): boolean {
  // Server-induced retryable: 408 (request timeout), 429 (rate limit),
  // 502/503/504 (upstream issues). 5xx other than these is opaque to us;
  // retrying them rarely helps but is configurable upstream.
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

/** Promise-based sleep that respects an `AbortSignal`. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason instanceof Error ? signal.reason : new Error("aborted"));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
