/**
 * Low-level HTTP transport for the SDK. Wraps `fetch` with:
 *   - timeout via composed `AbortController`
 *   - automatic gzip of large request bodies via `CompressionStream`
 *   - JSON encode/decode
 *   - retry policy (Retry-After + exp backoff + jitter on 429/5xx/network)
 *   - error mapping (HTTP status → SDK error class)
 *
 * No business logic lives here — it's a transport concern.
 */

import {
  errorFromResponse,
  GraphANNError,
  NetworkError,
  RateLimitError,
} from "./errors.js";
import type { ResolvedClientOptions } from "./options.js";
import {
  computeBackoff,
  isRetryableStatus,
  parseRetryAfter,
  sleep,
} from "./retry.js";

/** A single HTTP request as understood by `request()`. */
export interface HTTPRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  /** Query-string params; values are coerced to strings. `undefined` keys are dropped. */
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Coalescing key — when set, callers in the http layer share a single fetch. Higher layers manage it. */
  // (kept here for documentation; actual coalescing happens in client.ts)
}

const METRIC_REQUEST_START = "request.start";
const METRIC_REQUEST_END = "request.end";
const METRIC_REQUEST_RETRY = "request.retry";

/**
 * Execute a request against the GraphANN API. Returns the parsed JSON body
 * (or `undefined` on `204 No Content`). Throws an SDK-specific subclass of
 * `GraphANNError` on non-2xx responses or transport failures.
 */
export async function request<T>(
  opts: ResolvedClientOptions,
  req: HTTPRequest,
): Promise<T> {
  const url = buildUrl(opts.baseUrl, req.path, req.query);
  const startedAt = Date.now();
  const labels = { method: req.method, path: req.path };

  opts.metricsHook?.(METRIC_REQUEST_START, 1, labels);

  let lastError: GraphANNError | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    if (attempt > 0) {
      opts.metricsHook?.(METRIC_REQUEST_RETRY, attempt, labels);
    }

    try {
      const result = await doFetch<T>(opts, req, url, attempt);
      opts.metricsHook?.(METRIC_REQUEST_END, Date.now() - startedAt, {
        ...labels,
        outcome: "success",
      });
      return result;
    } catch (err) {
      if (!(err instanceof GraphANNError)) {
        // Transport-layer crash unrelated to fetch — bubble up unmodified.
        throw err;
      }
      lastError = err;

      // Decide whether to retry.
      const isRateLimit = err instanceof RateLimitError;
      const status =
        err instanceof RateLimitError
          ? 429
          : (err as { status?: number }).status ?? 0;
      const isNetwork = err instanceof NetworkError;
      const retryable = isRateLimit || isNetwork || isRetryableStatus(status);
      if (!retryable || attempt >= opts.maxRetries) {
        opts.metricsHook?.(METRIC_REQUEST_END, Date.now() - startedAt, {
          ...labels,
          outcome: "error",
        });
        throw err;
      }

      // Compute the wait. Honor Retry-After when supplied.
      let waitMs: number;
      if (isRateLimit && err.retryAfter !== null) {
        waitMs = err.retryAfter;
      } else {
        waitMs = computeBackoff(attempt, opts.initialBackoff, opts.maxBackoff);
      }
      try {
        await sleep(waitMs, req.signal);
      } catch {
        // The signal was aborted while we were waiting. Surface the original
        // error as a NetworkError so callers can `instanceof` cleanly.
        throw new NetworkError("request aborted", {
          cause: err,
          method: req.method,
          url,
        });
      }
    }
  }

  // Defensive: should be unreachable given the loop bounds.
  throw lastError ?? new NetworkError("request failed");
}

async function doFetch<T>(
  opts: ResolvedClientOptions,
  req: HTTPRequest,
  url: string,
  attempt: number,
): Promise<T> {
  const ctrl = new AbortController();
  const timeoutMs = req.timeoutMs ?? opts.timeout;
  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => ctrl.abort(new Error(`request timed out after ${timeoutMs}ms`)), timeoutMs)
      : undefined;

  const onUserAbort = (): void => {
    ctrl.abort(req.signal?.reason instanceof Error ? req.signal.reason : new Error("aborted"));
  };
  if (req.signal) {
    if (req.signal.aborted) onUserAbort();
    else req.signal.addEventListener("abort", onUserAbort, { once: true });
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": opts.userAgent,
    ...(req.headers ?? {}),
  };
  if (opts.apiKey) headers["x-api-key"] = opts.apiKey;
  if (opts.tenantId && !headers["x-tenant-id"]) headers["x-tenant-id"] = opts.tenantId;

  let body: BodyInit | undefined;
  if (req.body !== undefined && req.body !== null) {
    const json = JSON.stringify(req.body);
    headers["content-type"] = "application/json";
    if (
      opts.gzipThreshold > 0 &&
      json.length >= opts.gzipThreshold &&
      hasCompressionStream()
    ) {
      try {
        const compressed = await gzipString(json);
        // Wrap in a Blob (own its own ArrayBuffer copy) so the body satisfies
        // fetch's BodyInit across runtimes — Workers in particular reject raw
        // TypedArrays here, and TS narrows generic Uint8Array buffers in 5.9+.
        const ab = compressed.buffer.slice(
          compressed.byteOffset,
          compressed.byteOffset + compressed.byteLength,
        ) as ArrayBuffer;
        body = new Blob([ab], { type: "application/json" });
        headers["content-encoding"] = "gzip";
      } catch {
        // CompressionStream failed (rare). Fall back to plain body.
        body = json;
      }
    } else {
      body = json;
    }
  }

  let response: Response;
  try {
    response = await opts.fetch(url, {
      method: req.method,
      headers,
      body,
      signal: ctrl.signal,
    });
  } catch (cause) {
    clearTimeout(timeoutId);
    req.signal?.removeEventListener("abort", onUserAbort);
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new NetworkError(redactMessage(cause.message), {
        cause,
        method: req.method,
        url,
      });
    }
    throw new NetworkError(
      cause instanceof Error ? redactMessage(cause.message) : "network error",
      { cause, method: req.method, url },
    );
  }
  clearTimeout(timeoutId);
  req.signal?.removeEventListener("abort", onUserAbort);

  return parseResponse<T>(response, { method: req.method, url, attempt });
}

async function parseResponse<T>(
  response: Response,
  ctx: { method: string; url: string; attempt: number },
): Promise<T> {
  const requestId = response.headers.get("x-request-id") ?? undefined;

  if (response.status === 204) {
    return undefined as T;
  }

  // Parse body once. We accept JSON only; non-JSON 2xx is rare on this API.
  let parsed: unknown = null;
  const text = await response.text();
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (response.ok) {
    return parsed as T;
  }

  const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
  throw errorFromResponse(response.status, parsed, {
    method: ctx.method,
    url: ctx.url,
    requestId,
    retryAfter,
  });
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(baseUrl + safePath);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function hasCompressionStream(): boolean {
  return typeof (globalThis as { CompressionStream?: unknown }).CompressionStream === "function";
}

async function gzipString(payload: string): Promise<Uint8Array> {
  const Compression = (globalThis as unknown as { CompressionStream: typeof CompressionStream }).CompressionStream;
  const stream = new Compression("gzip");
  const writer = stream.writable.getWriter();
  const encoded = new TextEncoder().encode(payload);
  await writer.write(encoded);
  await writer.close();

  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  let total = 0;
  for (const c of chunks) total += c.byteLength;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * Strip anything that *might* be an api key or token from an error message.
 * Best-effort — the redactor doesn't replace what we don't recognize.
 */
function redactMessage(msg: string): string {
  return msg
    .replace(/(x-api-key:\s*)\S+/gi, "$1[redacted]")
    .replace(/(api[_-]?key=)([\w-]+)/gi, "$1[redacted]")
    .replace(/(authorization:\s*)\S+/gi, "$1[redacted]")
    .replace(/(bearer\s+)\S+/gi, "$1[redacted]");
}
