# AGENTS.md — `@graphann/client` (TypeScript)

Usage guide for coding agents working with the GraphANN TypeScript SDK.
Every snippet below uses real method names and signatures from the
current source (`src/client.ts`, `src/types.ts`, `src/options.ts`,
`src/errors.ts`). Do not invent methods or fields not shown here.

## Install

```bash
pnpm add @graphann/client@0.8.0
```

ESM-first with a CommonJS fallback. Runs on Node 20+, Deno, Bun,
Cloudflare Workers, and modern browsers. No runtime dependencies.

## Client construction and auth

```ts
import { Client } from "@graphann/client";

const client = new Client({
  baseUrl: "https://api.graphann.com", // required; trailing slash stripped
  apiKey: "ak_...",                    // sent as the X-API-Key header
  tenantId: "t_...",                   // default tenant for tenant-scoped calls
  timeout: 30_000,                     // ms, default 30000
  maxRetries: 3,                       // 429/503/network, default 3
});
```

`baseUrl` is the only required field. If `tenantId` is omitted on the
client, pass `{ tenantId }` in the per-call `RequestOptions`, or the call
throws (`tenantId is required`). Every method takes a final optional
`RequestOptions` argument: `{ signal?, tenantId?, timeout?, headers?,
bypassSingleflight?, bypassCache? }`.

## Create a tenant

```ts
const tenant = await client.createTenant({ name: "acme" });
// tenant.id is the tenant id used below as { tenantId: tenant.id }
```

## Create an index

```ts
const index = await client.createIndex({
  name: "docs",
  compression: "pq",   // "none" | "scalar" | "binary" | "pq" | "recompute" | ""
  approximate: true,
});
// index.id is the index id used by the document and search calls
```

A fresh index has dimension 0; the first ingest fixes the dimension.

## Ingest text documents

```ts
const res = await client.addDocuments(index.id, [
  { text: "first chunk of text", metadata: { src: "manual" } },
  { id: "doc-2", text: "second", upsert: true },
]);
// res.added, res.index_id, res.chunk_ids (string[]),
// res.external_ids (present only on sharded ingest of id-less docs)
```

`addDocuments` accepts either a `Document[]` (shown above) or a full
`AddDocumentsRequest` (`{ documents, defer_save?, bulk? }`, shown in the
bulk section). The server embeds the `text` for you.

## Ingest precomputed vectors

Attach a `vector` to every document to skip server-side embedding. The
batch is all-or-nothing: either every document carries a non-empty
`vector`, or none does (mixed batches are rejected with a 400). Vector
length must match the index dimension once it is fixed.

```ts
await client.addDocuments(index.id, [
  { id: "v-1", text: "label only", vector: [0.12, 0.04, /* ... */ -0.31] },
  { id: "v-2", text: "label only", vector: [0.55, -0.10, /* ... */ 0.02] },
]);
```

## Search

```ts
const out = await client.search({
  indexId: index.id,
  query: "how do audit trails work?",
  k: 10,
});
for (const hit of out.results) {
  console.log(hit.id, hit.score, hit.text);
}
```

Vector search: pass `vector` instead of `query` (one of the two is
required, or `search()` throws). Filter with
`filter: { equals?, repo_ids?, exclude_external_ids?, metadata_filter? }`.

Rerank and `ef_search`:

```ts
const reranked = await client.search({
  indexId: index.id,
  query: "audit trail requirements",
  k: 10,
  rerank: true,       // no-op unless the server has --reranker-url; needs `query`
  candidate_k: 50,    // first-stage pool fed to the reranker
  rerank_k: 10,       // results after rerank
  ef_search: 256,     // per-query HNSW beam width
});
for (const hit of reranked.results) {
  // hit.rerank_score is set only when the server actually reranked this entry;
  // when set, it drives the result ordering. hit.score is always the cosine.
  console.log(hit.id, hit.rerank_score ?? hit.score);
}
```

On a sharded deployment the response may also carry `partial`,
`shards_total`, `shards_ok`, and `degraded_shards`. These are undefined
on single-node and unsharded responses.

## Bulk ingest with defer_save / bulk, then flush

`defer_save: true` skips the per-batch save; the data stays in memory and
is still searchable. `bulk: true` also defers the per-node HNSW insert
(graph built once at flush) and is NOT searchable until built — though
the first search transparently triggers the pending build. Persist with
`flushIndex`.

```ts
for (const batch of batches) {
  await client.addDocuments(index.id, { documents: batch, bulk: true });
}
const flush = await client.flushIndex(index.id); // { flushed: boolean }
```

`rebuildGraph(indexId)` rebuilds the delta-HNSW graph for indexes
ingested before the neighbor-selection fix; returns
`{ rebuilt, chunks, wall_ms }`.

## API keys

The created key's secret is returned ONCE as `plaintext` and is never
re-readable. Store it on creation.

```ts
const created = await client.createAPIKey({ name: "ci-runner", user_id: "u_1" });
// created: { id, name, user_id?, plaintext, created_at }
console.log(created.plaintext); // the only time you can read it

const { api_keys } = await client.listAPIKeys();
// each item: { id, user_id?, name, created_at, last_used_at? } — no secret

await client.revokeAPIKey(created.id);
```

`user_id` is optional on creation. The list wrapper key is `api_keys`
(not `keys`); list items never include the secret.

## Error handling

All thrown errors extend `GraphANNError`. Branch with `instanceof`:

```ts
import {
  GraphANNError, ValidationError, AuthenticationError, AuthorizationError,
  NotFoundError, ConflictError, PayloadTooLargeError, RateLimitError,
  ServerError, NetworkError,
} from "@graphann/client";

try {
  await client.search({ indexId: index.id, query: "..." });
} catch (err) {
  if (err instanceof RateLimitError) {
    // err.retryAfter holds the server-requested delay in ms
  } else if (err instanceof AuthenticationError) {
    // refresh or fix the API key
  } else if (err instanceof GraphANNError) {
    console.error(err.code, err.message);
  } else {
    throw err;
  }
}
```

Status mapping: 400 `ValidationError`, 401 `AuthenticationError`, 403
`AuthorizationError`, 404 `NotFoundError`, 409 `ConflictError`, 413
`PayloadTooLargeError`, 429 `RateLimitError`, 5xx `ServerError`,
transport/abort `NetworkError`. `compactIndex` and `rebuildGraph` return
409 (`ConflictError`) when an operation is already in progress.

## Key gotchas

- The created API key `plaintext` is returned ONCE. There is no endpoint
  to read it again; persist it at creation time.
- The server caps a single request body at 16 MB. For precomputed-vector
  ingest that is roughly 1700 documents per batch; split larger sets and
  ingest in multiple `addDocuments` calls.
- `bulk: true` data is not searchable until the graph is built. The first
  search triggers the pending build, but call `flushIndex` to persist and
  build explicitly when you control timing.
- `deleteChunks(indexId, chunkIds)` takes a non-empty `number[]` and posts
  the ids in the request body; the path component is hardcoded to
  `.../chunks/0` (the server reads the ids from the body, not the path).
- Cancellation: pass `{ signal }` from an `AbortController`. The signal
  also covers waits between retries; aborting in flight surfaces a
  `NetworkError`.
- `listDocuments(...)` returns an async iterator (`Paginator`); iterate
  with `for await` over `{ items, nextCursor }` pages.
