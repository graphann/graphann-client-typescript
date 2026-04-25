/**
 * Error class hierarchy for the GraphANN SDK.
 *
 * Every thrown value extends `GraphANNError`, which itself extends the native
 * `Error`. Subclasses are HTTP-status- or transport-specific so callers can
 * `instanceof` discriminate without parsing strings.
 *
 * Sensitive fields (API keys, tokens) are NEVER included in error messages.
 */

import type { ServerErrorEnvelope } from "./types.js";

/** Common context attached to most SDK errors. */
export interface GraphANNErrorOptions {
  /** Server-provided error code (e.g. `"validation_error"`, `"not_found"`). */
  code?: string;
  /** Underlying cause; preserved for `Error.cause` chaining. */
  cause?: unknown;
  /** Server-provided structured details, when present. */
  details?: unknown;
  /** HTTP method that triggered the error. */
  method?: string;
  /** Request URL (with secrets stripped). */
  url?: string;
  /** Server `request_id` header, if echoed. */
  requestId?: string;
}

/**
 * Base class for every error thrown by the SDK.
 */
export class GraphANNError extends Error {
  public readonly code: string | undefined;
  public readonly details: unknown;
  public readonly method: string | undefined;
  public readonly url: string | undefined;
  public readonly requestId: string | undefined;

  constructor(message: string, options: GraphANNErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = options.code;
    this.details = options.details;
    this.method = options.method;
    this.url = options.url;
    this.requestId = options.requestId;
    // Maintain proper prototype chain for `instanceof` across transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Authentication required / API key invalid (HTTP 401). */
export class AuthenticationError extends GraphANNError {}

/** API key is valid but lacks permission for the requested action (HTTP 403). */
export class AuthorizationError extends GraphANNError {}

/** Resource does not exist (HTTP 404). */
export class NotFoundError extends GraphANNError {}

/** Conflicting state, e.g. job already in flight (HTTP 409). */
export class ConflictError extends GraphANNError {}

/** Request body exceeds the server's max-bytes limit (HTTP 413). */
export class PayloadTooLargeError extends GraphANNError {}

/**
 * Rate limit hit (HTTP 429).
 *
 * `retryAfter` is the parsed Retry-After header in milliseconds. `null` when
 * the header is absent or unparseable.
 */
export class RateLimitError extends GraphANNError {
  public readonly retryAfter: number | null;

  constructor(message: string, retryAfter: number | null, options: GraphANNErrorOptions = {}) {
    super(message, options);
    this.retryAfter = retryAfter;
  }
}

/** Validation failed (HTTP 400). */
export class ValidationError extends GraphANNError {}

/** Server-side failure (HTTP 5xx). */
export class ServerError extends GraphANNError {
  public readonly status: number;

  constructor(message: string, status: number, options: GraphANNErrorOptions = {}) {
    super(message, options);
    this.status = status;
  }
}

/**
 * Transport-level failure: TLS error, DNS error, connection reset, or the
 * request was aborted by an `AbortSignal`.
 */
export class NetworkError extends GraphANNError {}

/**
 * Server returned a status code that's syntactically valid but doesn't map to
 * any known business-level error class. Surfaces the raw status for callers
 * that want to handle it specifically.
 */
export class UnexpectedStatusError extends GraphANNError {
  public readonly status: number;

  constructor(message: string, status: number, options: GraphANNErrorOptions = {}) {
    super(message, options);
    this.status = status;
  }
}

/** Internal: parse the standard server error envelope, never throws. */
export function parseErrorEnvelope(payload: unknown): ServerErrorEnvelope["error"] | null {
  if (!payload || typeof payload !== "object") return null;
  const env = payload as { error?: unknown };
  if (!env.error || typeof env.error !== "object") return null;
  const e = env.error as { code?: unknown; message?: unknown; details?: unknown };
  const message = typeof e.message === "string" ? e.message : null;
  if (message === null) return null;
  return {
    code: typeof e.code === "string" ? e.code : "unknown",
    message,
    details: e.details,
  };
}

/**
 * Map an HTTP response (status + parsed body) onto the appropriate SDK error.
 * Used by the http layer; safe to call from user code if you already have a
 * status + body in hand.
 */
export function errorFromResponse(
  status: number,
  body: unknown,
  context: { method?: string; url?: string; requestId?: string; retryAfter?: number | null } = {},
): GraphANNError {
  const env = parseErrorEnvelope(body);
  const code = env?.code;
  const message = env?.message ?? defaultMessageForStatus(status);
  const details = env?.details;
  const opts: GraphANNErrorOptions = {
    code,
    details,
    method: context.method,
    url: context.url,
    requestId: context.requestId,
  };

  switch (status) {
    case 400:
      return new ValidationError(message, opts);
    case 401:
      return new AuthenticationError(message, opts);
    case 403:
      return new AuthorizationError(message, opts);
    case 404:
      return new NotFoundError(message, opts);
    case 409:
      return new ConflictError(message, opts);
    case 413:
      return new PayloadTooLargeError(message, opts);
    case 429:
      return new RateLimitError(message, context.retryAfter ?? null, opts);
    default:
      if (status >= 500 && status < 600) {
        return new ServerError(message, status, opts);
      }
      return new UnexpectedStatusError(message, status, opts);
  }
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Bad request";
    case 401:
      return "Authentication required";
    case 403:
      return "Forbidden";
    case 404:
      return "Not found";
    case 409:
      return "Conflict";
    case 413:
      return "Payload too large";
    case 429:
      return "Rate limit exceeded";
    default:
      if (status >= 500) return `Server error (HTTP ${status})`;
      return `Unexpected status (HTTP ${status})`;
  }
}
