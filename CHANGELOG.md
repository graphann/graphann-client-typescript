# Changelog

All notable changes to `@graphann/client` are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/) and the project uses
[Semantic Versioning](https://semver.org/).

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
