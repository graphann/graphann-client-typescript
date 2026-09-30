# Changelog

All notable changes to `@graphann/client` are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/) and the project uses
[Semantic Versioning](https://semver.org/).

## 0.10.0 - 2026-09-30

### Added

- `getTenantQuota` and `updateTenantQuota` (`GET`/`PUT /v1/tenants/{id}/quota`).
- `getAPIKeyStatus` (`GET /v1/admin/api-key-status`).
- `listAllBackups` (`GET /v1/admin/backups`, filters `tenantId`, `indexId`,
  `limit`, keyset `cursor`) and `getBackupStatus`
  (`GET /v1/admin/backups/status`).
- Types `TenantQuotaResponse`, `UpdateTenantQuotaRequest`, `AdminBackupRow`,
  `AdminBackupList`, `BackupScheduleStatus`, `APIKeyStatusTenantRow`,
  `APIKeyStatusResponse`, `ListAllBackupsOptions`, `ReadyResponse`,
  `SharedIndexListResponse`, `LLMSettingsPatch`.
- `restoreBackup` also accepts a `RestoreBackupRequest`, which carries the
  optional restored-index `name`.
- `search` and `batchSearch` accept `group_by` and `max_per_doc`; `createAPIKey`
  accepts `role`; `createIndex` accepts `chunk_size` and `chunk_overlap`.
- Regenerated types add `AddDocumentsResponse.warnings`,
  `EmbedSpaceIndexRow.num_chunks`, `IndexInfo.chunk_size`/`chunk_overlap`, the
  `empty` `embed_space_state`, seven `EmbedSpaceAdminResponse.counts` keys and
  the `insufficient_storage` error code.

### Fixed

- `search` dropped `group_by` and `max_per_doc`, and `createAPIKey` dropped
  `role`, before they reached the wire.
- `updateLLMSettings` and `deleteLLMSettings` return `LLMSettings`, which is
  what the server sends, instead of a `{ message, org_id, settings }` envelope
  the server never returned. `UpdateLLMSettingsResponse` and
  `DeleteLLMSettingsResponse` are now aliases of `LLMSettings`.
- `ready` returns `ReadyResponse` (`status` is `"ready"`), and
  `listSharedIndexes` returns `SharedIndexListResponse`.
- Source and tests are reformatted to pass `prettier --check`.

## v0.9.1 - 2026-09-07

### Fixed

- Request gzip is now disabled by default; a positive `gzipThreshold` still
  opts in for servers or proxies that decode compressed requests.
- Successful mutations invalidate all cached reads. Reads started before a
  mutation cannot refill the cache or coalesce with reads started after it.
  Read-only POSTs and failed mutations preserve the cache.
- Search responses use the generated sharded metadata, including
  `rerank_applied`, instead of an outdated handwritten overlay.
- Type generation and staleness checks find the bundled spec in standalone
  checkouts and the shared spec in the monorepo. Generated headers use a
  portable source path instead of the checkout's absolute path.

### Changed

- Installation uses the built `graphann-client-0.9.1.tgz` package from the
  GitHub release instead of requiring a local build. No npm registry
  publication is required.

## v0.9.0 - 2026-08-11

### Added

- The nine endpoints no SDK in any language implemented, all absent because the
  server's OpenAPI spec omitted them: `createBackup`, `listBackups`,
  `restoreBackup`, `deleteBackup`, `batchSearch`, `compactAllIndexes`,
  `getLicenseStatus`, `getLicenseAudit`, `getEmbedSpaceAdmin`.
- Six previously-unreachable request fields: `hybrid` (BM25 + RRF lexical
  fusion, text queries only), `vector_b64` (base64 little-endian float32 query
  vector, mutually exclusive with `vector`), `omit_text` on the search filter,
  and the `embedding_endpoint` / `embedding_dimension` / `embedding_api_key_env`
  per-index embedder override.

### Changed

- Wire types are generated from the OpenAPI spec into `src/generated/types.ts`
  by `scripts/gen-types.mjs`, rather than hand-maintained. The spec is vendored
  at `api/openapi/spec.yaml`, so generation works from a fresh clone. A
  staleness check runs as `pretest` and fails if the committed file does not
  match what the generator produces.
- `src/types.ts` is now a facade aliasing the generated schemas. The hand-written
  cache, singleflight, retry, pagination and HTTP layers are unchanged.

### Fixed

- `BulkDeleteDocumentsResponse` is exported from the package root again. It was
  dropped from `index.ts` while remaining the declared return type of
  `client.bulkDeleteDocuments`, so callers could call the method but could not
  name what it returned.
- The search docs described "hybrid search" as passing either a query or a
  vector. That is dense search with two input modes. The real `hybrid` flag is
  now documented; the old wording came from the spec and has been corrected there.

## v0.8.0 - 2026-06-17

### Fixed

- API-key wire contract corrected to match the server
  (`internal/server/apikey_handlers.go`):
  - The create-key response one-time secret is decoded from the
    `plaintext` json field (was `secret`, which silently dropped the key).
  - The list-keys response wrapper key is `api_keys` (was `keys`).
  - `createAPIKey` now sends `{ user_id, name }` (the `role` field was
    removed; `user_id` was missing).
  - `APIKey` is the create response (`id`, `name`, `user_id?`,
    `plaintext`, `created_at`). The list returns `APIKeyListItem`
    entries (`id`, `user_id?`, `name`, `created_at`, `last_used_at?`).
  - Removed invented fields that the server does not emit: `secret`,
    `prefix`, `role`, `revoked_at`, and the `total` count on the list
    response.

  This is mildly breaking for code that read the old struct fields
  (`APIKey.secret`/`prefix`/`role`/`revoked_at`,
  `ListAPIKeysResponse.total`, or iterated `APIKey[]` from the list).
  Read `APIKey.plaintext` on creation and `APIKeyListItem` fields when
  listing.

### Added

- `AGENTS.md` — an LLM-usage guide for coding agents, grounded in the
  current SDK surface.

## 0.7.0 - 2026-06-10

### Added

- `Document.vector?: number[]` — precomputed-vector ingest. When every
  document in an `addDocuments` batch carries a non-empty `vector`, the
  server skips embedding and ingests the vectors as-is. All-or-nothing
  per batch: mixed batches (some with, some without) are rejected with
  a 400. Vector length must match the index dimension once fixed; the
  first ingest into a fresh index fixes it. The 16 MB request-body cap
  limits precomputed batches to roughly 1700 documents.
- `Client.addDocuments` now also accepts a full `AddDocumentsRequest`
  (`{ documents, defer_save?, bulk? }`) in place of the plain
  `Document[]`. `defer_save: true` skips the per-batch save (data stays
  searchable; persist via `flushIndex`). `bulk: true` implies
  `defer_save` and defers the HNSW graph build until flush — bulk data
  is not searchable until then, except that the first search against a
  pending deferred build transparently triggers it (build-on-read).
  Existing `Document[]` call sites are unchanged.
- `Client.flushIndex(indexId)` — `POST .../indexes/{id}/flush`.
  Persists the live index's in-memory delta; any pending bulk-deferred
  graph is built once, concurrently, inside the flush. Returns
  `FlushIndexResponse` (`{ flushed: true }`).
- `Client.rebuildGraph(indexId)` — `POST .../indexes/{id}/rebuild-graph`.
  In-place delta-HNSW rebuild for indexes ingested before the 2026-06
  neighbor-selection fix. Returns `RebuildGraphResponse`
  (`{ rebuilt, chunks, wall_ms }`); throws `ConflictError` while a
  compaction is in progress.
- `SearchRequest.ef_search?: number` — per-query HNSW beam width.
  Omitted/`0` uses the server default (`--search-ef`, default 64). The
  server clamps rather than rejects: negative falls back to the
  default, values above 2000 are capped. Binary/PQ flat scans ignore
  it.
- `SearchResponse` gains optional sharded-path fields: `partial?`,
  `shards_total?`, `shards_ok?` (always present on the sharded path)
  and `degraded_shards?: string[]` (only when non-empty). Single-node
  and unsharded deployments keep the byte-identical `{results, total}`
  response — treat all four as optional. Note: `rerank`/`candidate_k`/
  `rerank_k` are NOT applied on the sharded path, and results are
  deduped by external ID keeping the highest score.
- `AddDocumentsResponse.external_ids?: string[]` — present only when
  the server minted at least one external ID (sharded ingest of ID-less
  documents); positionally aligned with the request array and includes
  client-supplied IDs too. Persist these as the durable document IDs.
- New types exported: `FlushIndexResponse`, `RebuildGraphResponse`.

### Fixed

- Body-less mutating requests (`compactIndex`, `clearIndex`,
  `processPending`, `runIndexGC`, `runAdminGC`, `cleanupOrphans`, and
  the new `flushIndex` / `rebuildGraph`) now send an empty JSON object
  `{}` with `Content-Type: application/json`. The server's content-type
  middleware rejects every POST without the header (400), so these
  calls previously failed against current servers. DELETE without a
  body is exempt and stays body-less.

### Changed

- `UpdateIndexRequest.compression` docs now spell out the server
  semantics: the change is metadata-only (applies at the next
  compaction, no rebuild); `""` and `"none"` both fold to the server's
  `--default-compression`; invalid values currently surface as a 500
  `ServerError`, not a 400.
- `compactIndex` docs clarify the server returns `200 OK` with
  `status: "compacting"` (compaction is asynchronous; no poll endpoint
  — observe completion via live-stats/logs).
- `SDK_VERSION` bumped to `"0.7.0"` (was lagging at `"0.4.0"`).

## 0.6.0 - 2026-05-01

### Added

- `SearchRequest.rerank`, `SearchRequest.candidate_k`, and
  `SearchRequest.rerank_k` fields wire the optional cross-encoder
  reranker. When the server has a reranker configured (via
  `--reranker-url`), set `rerank: true` to rescore the top-`candidate_k`
  HNSW candidates with the reranker and return the top-`rerank_k` (or
  top-`k`). Defaults: `candidate_k = max(4*k, 50)` (server clamps to
  `[k, 1000]`), `rerank_k = k`. No-op against non-rerank-aware servers
  — safe to roll out unconditionally.
- `SearchResult.rerank_score?: number` — populated only when the
  server actually applied the reranker. Carries the cross-encoder's
  native relevance score (different scale from cosine, typically
  -10..10 for bge-reranker-v2-m3) and reflects the result ordering.
  Absent when the server has no reranker, the request didn't ask for
  rerank, or the reranker errored and the server fell back.

### Unchanged

- `SearchResult.score` is still always the first-stage cosine
  similarity, regardless of rerank state. Existing client code that
  only reads `score` keeps working — even when accidentally hitting
  a rerank-enabled endpoint.

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
