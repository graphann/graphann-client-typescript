/**
 * `ClientOptions` and defaults.
 */

import type { TenantID } from "./types.js";

export interface ClientOptions {
  /** Base URL of the GraphANN server. Trailing slash is stripped. */
  baseUrl: string;

  /** API key — sent in the `X-API-Key` header. */
  apiKey?: string;

  /**
   * Default tenant id. If set, every method that needs a tenant uses this
   * unless a per-request override is provided. Forwarded as `X-Tenant-ID`
   * when authenticated requests are made.
   */
  tenantId?: TenantID;

  /** Default request timeout, in ms. Default: `30000`. */
  timeout?: number;

  /** Maximum retry attempts on 429/503/network errors. Default: `3`. */
  maxRetries?: number;

  /** Initial backoff delay in ms; doubled on each retry up to `maxBackoff`. */
  initialBackoff?: number;

  /** Cap on the exponential backoff window, in ms. Default: `15000`. */
  maxBackoff?: number;

  /**
   * Compress request bodies with gzip when their size exceeds this threshold,
   * in bytes. `0` disables. Default: `65536`.
   */
  gzipThreshold?: number;

  /**
   * Optional User-Agent suffix appended to the SDK-generated UA string.
   * Useful to identify the calling application — e.g. `"my-app/1.2.3"`.
   */
  userAgent?: string;

  /** Enable single-flight coalescing of identical concurrent reads. Default: `true`. */
  singleflight?: boolean;

  /** Enable LRU+TTL response cache for safe, idempotent reads. Default: `false`. */
  cache?: boolean;

  /** Cache size (entries). Default: `256`. */
  cacheSize?: number;

  /** Cache TTL, in ms. Default: `30000`. */
  cacheTTL?: number;

  /**
   * Optional metrics hook called on every request lifecycle event.
   *
   *   name: "request.start" | "request.end" | "request.retry" | "cache.hit" | "cache.miss" | "singleflight.coalesced"
   */
  metricsHook?: (name: string, value: number, labels?: Record<string, string>) => void;

  /**
   * Custom `fetch` implementation. Defaults to the platform's native `fetch`.
   * Useful for tests or for environments that need a polyfill.
   */
  fetch?: typeof fetch;
}

export interface ResolvedClientOptions {
  baseUrl: string;
  apiKey: string | undefined;
  tenantId: TenantID | undefined;
  timeout: number;
  maxRetries: number;
  initialBackoff: number;
  maxBackoff: number;
  gzipThreshold: number;
  userAgent: string;
  singleflight: boolean;
  cache: boolean;
  cacheSize: number;
  cacheTTL: number;
  metricsHook: ((name: string, value: number, labels?: Record<string, string>) => void) | undefined;
  fetch: typeof fetch;
}

/** SDK version. Update on every release. */
export const SDK_VERSION = "0.4.0";

/** Best-effort runtime/platform detection for the User-Agent string. */
function detectRuntime(): { runtime: string; platform: string } {
  // Cloudflare Workers expose `navigator.userAgent === "Cloudflare-Workers"`.
  // Bun, Deno, and Node each set distinct globals we can sniff without imports.
  const g = globalThis as Record<string, unknown>;
  if (typeof g.Bun !== "undefined") {
    const bun = g.Bun as { version?: string };
    return { runtime: `bun/${bun.version ?? "unknown"}`, platform: "bun" };
  }
  if (typeof g.Deno !== "undefined") {
    const deno = g.Deno as { version?: { deno?: string } };
    return { runtime: `deno/${deno.version?.deno ?? "unknown"}`, platform: "deno" };
  }
  if (typeof g.WorkerGlobalScope !== "undefined" || typeof g.caches === "object") {
    const nav = (g.navigator as { userAgent?: string } | undefined)?.userAgent ?? "";
    if (nav.includes("Cloudflare")) return { runtime: "cloudflare-workers", platform: "workers" };
  }
  if (typeof g.process !== "undefined") {
    const proc = g.process as { versions?: { node?: string }; platform?: string };
    if (proc.versions?.node) {
      return {
        runtime: `node/${proc.versions.node}`,
        platform: proc.platform ?? "node",
      };
    }
  }
  if (typeof g.window !== "undefined") {
    return { runtime: "browser", platform: "browser" };
  }
  return { runtime: "unknown", platform: "unknown" };
}

function buildUserAgent(suffix: string | undefined): string {
  const { runtime, platform } = detectRuntime();
  const base = `graphann-typescript/${SDK_VERSION} (${runtime}; ${platform})`;
  return suffix ? `${base} ${suffix}` : base;
}

/**
 * Resolve user-supplied options against defaults. Throws if `baseUrl` is
 * missing or malformed.
 */
export function resolveOptions(options: ClientOptions): ResolvedClientOptions {
  if (!options || typeof options.baseUrl !== "string" || options.baseUrl.length === 0) {
    throw new TypeError("ClientOptions.baseUrl is required");
  }
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  try {
    new URL(baseUrl);
  } catch {
    throw new TypeError(`ClientOptions.baseUrl is not a valid URL: ${options.baseUrl}`);
  }

  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new TypeError(
      "No fetch implementation available. Provide ClientOptions.fetch or run on a platform with native fetch.",
    );
  }

  return {
    baseUrl,
    apiKey: options.apiKey,
    tenantId: options.tenantId,
    timeout: options.timeout ?? 30_000,
    maxRetries: options.maxRetries ?? 3,
    initialBackoff: options.initialBackoff ?? 250,
    maxBackoff: options.maxBackoff ?? 15_000,
    gzipThreshold: options.gzipThreshold ?? 64 * 1024,
    userAgent: buildUserAgent(options.userAgent),
    singleflight: options.singleflight ?? true,
    cache: options.cache ?? false,
    cacheSize: options.cacheSize ?? 256,
    cacheTTL: options.cacheTTL ?? 30_000,
    metricsHook: options.metricsHook,
    fetch: fetchImpl.bind(globalThis),
  };
}
