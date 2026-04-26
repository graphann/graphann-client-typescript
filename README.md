# `@graphann/client`

Official TypeScript client SDK for the [GraphANN](https://graphann.com)
vector database.

- ESM-first with CommonJS fallback, full type declarations.
- Runs on Node 20+, Deno, Bun, Cloudflare Workers, and modern browsers.
- Zero runtime dependencies — uses native `fetch`, `AbortController`,
  `CompressionStream`.
- Tree-shakable, side-effect free.
- Built-in retry, single-flight coalescing, optional LRU + TTL cache,
  cursor pagination as `AsyncIterable`, optional metrics hook.

## Install

```bash
pnpm add @graphann/client
# or
npm install @graphann/client
# or
yarn add @graphann/client
```

## Quickstart

```ts
import { Client, GraphANNError, RateLimitError } from "@graphann/client";

const client = new Client({
  baseUrl: "https://api.graphann.com",
  apiKey: "ak_...",
  tenantId: "t_...",
  timeout: 30_000,
  maxRetries: 3,
});

// Health
const health = await client.health();

// Search
const results = await client.search({
  indexId: "i_...",
  query: "hello",
  k: 10,
});

// Cursor pagination as async iterator
for await (const page of client.listDocuments({ indexId: "i_..." })) {
  for (const doc of page.items) {
    console.log(doc.id);
  }
}

// Cancellation via AbortController
const ctrl = new AbortController();
setTimeout(() => ctrl.abort(), 5_000);
const r = await client.search({ indexId: "i_...", query: "..." }, { signal: ctrl.signal });
```

A complete end-to-end example lives in
[`examples/quickstart.ts`](./examples/quickstart.ts).

## Configuration

```ts
new Client({
  baseUrl: "https://api.graphann.com",
  apiKey: "ak_...",       // X-API-Key header
  tenantId: "t_...",       // Default tenant for tenant-scoped methods
  timeout: 30_000,         // ms — per-request timeout
  maxRetries: 3,           // 0 disables retries
  initialBackoff: 250,     // ms — first backoff window
  maxBackoff: 15_000,      // ms — exp backoff cap
  gzipThreshold: 64 * 1024,// bytes — bodies >= this are gzip-compressed
  userAgent: "my-app/1.0", // appended to the SDK UA
  singleflight: true,      // collapse concurrent identical reads
  cache: false,            // LRU + TTL cache (off by default)
  cacheSize: 256,
  cacheTTL: 30_000,        // ms
  metricsHook: (name, value, labels) => { /* ... */ },
});
```

### Per-request overrides

Every method accepts a final `RequestOptions` argument:

```ts
type RequestOptions = {
  signal?: AbortSignal;
  tenantId?: string;
  timeout?: number;
  bypassSingleflight?: boolean;
  bypassCache?: boolean;
  headers?: Record<string, string>;
};
```

## Error handling

All thrown values extend `GraphANNError`. Branch with `instanceof`:

```ts
import {
  AuthenticationError, AuthorizationError, ConflictError, GraphANNError,
  NetworkError, NotFoundError, PayloadTooLargeError, RateLimitError,
  ServerError, ValidationError,
} from "@graphann/client";

try {
  await client.search({ indexId: "i_x", query: "..." });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.warn("Slow down. Retry after ms:", err.retryAfter);
  } else if (err instanceof AuthenticationError) {
    // refresh API key, etc.
  } else if (err instanceof GraphANNError) {
    console.error("GraphANN error", err.code, err.message);
  } else {
    throw err;
  }
}
```

Status mapping:

| Status | Class                  |
|--------|------------------------|
| 400    | `ValidationError`      |
| 401    | `AuthenticationError`  |
| 403    | `AuthorizationError`   |
| 404    | `NotFoundError`        |
| 409    | `ConflictError`        |
| 413    | `PayloadTooLargeError` |
| 429    | `RateLimitError`       |
| 5xx    | `ServerError`          |
| transport / abort | `NetworkError` |

## API surface

| Group     | Methods |
|-----------|---------|
| Health    | `health` |
| Tenants   | `listTenants`, `createTenant`, `getTenant`, `deleteTenant` |
| Indexes   | `listIndexes`, `createIndex`, `getIndex`, `deleteIndex`, `updateIndex`, `getIndexStatus`, `buildIndex`, `compactIndex`, `clearIndex`, `getLiveStats` |
| Documents | `addDocuments`, `importDocuments`, `listDocuments` (async iterator), `getDocument`, `deleteDocument`, `bulkDeleteDocuments`, `bulkDeleteByExternalIds`, `cleanupOrphans` |
| Search    | `search`, `searchText`, `searchVector`, `multiSearch` |
| Jobs      | `switchEmbeddingModel`, `getJob`, `listJobs` |
| Cluster   | `getClusterNodes`, `getClusterShards`, `getClusterHealth` |
| LLM       | `getLLMSettings`, `updateLLMSettings`, `deleteLLMSettings` |
| API keys  | `createAPIKey`, `listAPIKeys`, `revokeAPIKey` |
| Org sync  | `syncDocuments` |

## Performance

- **Single-flight coalescing**: concurrent calls with identical method,
  path, query and body share one in-flight request. On by default for
  idempotent (safe) methods.
- **Optional response cache**: opt-in LRU + TTL cache for safe reads.
  Set `cache: true` plus `cacheTTL` and `cacheSize`. Mutating calls are
  never cached. Use `bypassCache: true` per call to skip.
- **Automatic gzip**: request bodies above `gzipThreshold` (default 64
  KiB) are compressed with the platform's `CompressionStream`.
- **Retry-After honoring**: HTTP 429 responses with a `Retry-After`
  header (delta-seconds or HTTP-date) defer the next attempt by the
  exact amount the server requested.
- **Exponential backoff with full jitter** on transient failures.

## Cancellation

Pass an `AbortSignal` in the per-request options. The signal also covers
the time spent waiting between retries — aborting in flight surfaces a
`NetworkError`.

```ts
const ctrl = new AbortController();
setTimeout(() => ctrl.abort(), 5_000);
await client.search({ indexId: "i_x", query: "..." }, { signal: ctrl.signal });
```

## Compatibility

| Runtime              | Status |
|----------------------|--------|
| Node 20+             | Tested |
| Bun 1.x              | Compatible (uses native fetch) |
| Deno 1.40+           | Compatible (uses native fetch) |
| Cloudflare Workers   | Compatible (uses native fetch + CompressionStream) |
| Modern browsers      | Compatible (CORS depends on the server) |

## Development

```bash
pnpm install
pnpm build       # → dist/index.mjs, dist/index.cjs, dist/index.d.ts
pnpm test        # vitest unit tests with msw mocks
pnpm typecheck
pnpm lint
```

Integration tests run against a real server when both
`GRAPHANN_BASE_URL` and `GRAPHANN_API_KEY` are set.

## License

Commercial. See [`LICENSE`](./LICENSE).
