# Changelog

All notable changes to `@graphann/client` are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/) and the project uses
[Semantic Versioning](https://semver.org/).

## 0.5.0 - 2026-04-30

### Breaking

- `Client.cleanupOrphans` signature is now
  `cleanupOrphans(minAge?: string, dryRun?: boolean, opts?: RequestOptions)`.
  The previous signature accepted `RequestOptions` as the first
  parameter; callers that passed `opts` directly must move it to the
  third position. Default-arg callers (`client.cleanupOrphans()`) are
  unaffected. Server enforces a 5-minute floor on positive `minAge`
  values.

### Changed

- `CleanupOrphansResponse` gains optional `min_age?: string` and
  `dry_run?: boolean` fields echoing what the server applied. Older
  servers that omit them yield `undefined`.

## 0.3.0

### Breaking

- `Client.searchText(req)` removed — endpoint deleted server-side. Use
  `Client.search({ indexId, query, k, filter })` instead.
- `Client.searchVector(req)` removed — endpoint deleted server-side. Use
  `Client.search({ indexId, vector, k, filter })` instead.
- `Client.buildIndex(indexId)` removed — was a no-op stub; endpoint deleted
  server-side.
- Types removed from public exports: `SearchTextRequest`, `SearchVectorRequest`,
  `BuildIndexResponse`.

### Added

- `Client.upsertResource(indexId, resourceId, req)` — `PUT
  .../resources/{resourceID}`. Atomically creates or replaces a named resource
  in one round-trip. Returns `UpsertResourceResponse` with `resource_id`,
  `chunks_added`, `chunks_tombstoned`, `operation` (`"create"` | `"update"`).
- New types exported: `UpsertResourceRequest`, `UpsertResourceResponse`,
  `CompressionType`.

### Changed

- `CreateIndexRequest` and `UpdateIndexRequest` gain optional `compression`
  (`CompressionType`) and `approximate` (`boolean`) fields.
- `IndexInfo` gains optional `compression` and `approximate` fields.
- `SearchFilter` gains optional `equals` (`Record<string, string>`) for
  metadata pre-filtering.
- `compactIndex` now documents that a 409 response throws `ConflictError`
  (compaction already running — retry after back-off).
- `SDK_VERSION` bumped to `"0.3.0"`.

## 0.2.0

### Breaking

Method names on `Client` are aligned with the sibling SDKs (Go, Python).
Wire protocol is unchanged; only the TypeScript surface moved.

| Before              | After                |
|---------------------|----------------------|
| `clusterHealth`     | `getClusterHealth`   |
| `clusterNodes`      | `getClusterNodes`    |
| `clusterShards`     | `getClusterShards`   |
| `syncOrgDocuments`  | `syncDocuments`      |

`Client.deleteChunk(indexId, chunkId)` was replaced with
`Client.deleteChunks(indexId, chunkIds: number[])` to match the
server's batch-delete semantics (the route already accepted
`{chunk_ids: [...]}` and ignored the path-segment chunk ID; the SDK now
sends `/0` as a sentinel like the Go SDK). `DeleteChunkResponse` is now
`DeleteChunksResponse` (shape unchanged: `{deleted, index_id}`).

#### Migration

```ts
// before
await client.clusterHealth();
await client.clusterNodes();
await client.clusterShards();
await client.syncOrgDocuments({ orgId, user_id, source_type, shared, documents });
await client.deleteChunk(indexId, 9);

// after
await client.getClusterHealth();
await client.getClusterNodes();
await client.getClusterShards();
await client.syncDocuments({ orgId, user_id, source_type, shared, documents });
await client.deleteChunks(indexId, [9]);
```

## 0.1.1

### Added

- `Client.ready()` for `GET /ready` (mirrors `health()`).
- `Client.getChunk(indexId, chunkId)` for `GET .../chunks/{chunkID}`.
- `Client.deleteChunk(indexId, chunkId)` for `DELETE .../chunks/{chunkID}`
  (per-chunk; the SDK wraps the ID in the `chunk_ids` body the server
  expects).
- `Client.getPendingStatus(indexId)`, `Client.processPending(indexId)`,
  `Client.clearPending(indexId)` for the batch-import pending queue
  (`GET / POST / DELETE .../pending` and `.../process`).
- `Client.listSharedIndexes(orgId)` and
  `Client.listUserIndexes(orgId, userId)` for the org-scoped index
  listings.
- New types: `ChunkResponse`, `DeleteChunkResponse`,
  `PendingStatusResponse`, `ProcessPendingResponse`,
  `ClearPendingResponse`, `OrgIndexListResponse`,
  `DeleteLLMSettingsResponse`.

### Changed

- `Client.getLLMSettings`, `updateLLMSettings`, `deleteLLMSettings` now
  use `/v1/orgs/{orgID}/llm-settings` (the old `/settings/llm` path was
  never wired on the server). `updateLLMSettings` is now `PATCH` with a
  partial-merge body; the request type is `Partial<LLMSettings>`.
- `deleteLLMSettings` now returns `DeleteLLMSettingsResponse` (settings
  field is optional on reset).

## 0.1.0 — initial release

- First public TypeScript SDK for GraphANN.
- Methods cover: health, tenant CRUD, index CRUD + maintenance, document
  ingestion / import / bulk-delete / cursor-pagination, search (text /
  vector / hybrid / multi-source), async jobs (hot model switch + read /
  list), cluster read-only introspection, LLM settings, API key
  management (forward-looking).
- Dual ESM + CJS distribution with type declarations.
- Built-in retry policy honoring `Retry-After`, exponential backoff with
  jitter, single-flight coalescing, optional LRU+TTL response cache,
  optional metrics hook, and gzip of large request bodies.
- Tested with vitest + msw on Node 20+; integration suite gated by
  `GRAPHANN_BASE_URL` / `GRAPHANN_API_KEY` environment variables.
