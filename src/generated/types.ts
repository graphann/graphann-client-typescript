/**
 * GENERATED — do not hand-edit.
 *
 * Source:     api/openapi/spec.yaml
 * Generator:  npx --yes openapi-typescript@7 <spec> -o src/generated/types.ts
 * Regenerate: pnpm run gen:types      (from the SDK root)
 * Verify:     pnpm run gen:types:check
 *
 * Fix drift by editing the spec and re-running the generator, never this file.
 */

export interface paths {
  "/health": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Health check
     * @description Returns server health status. Always returns 200 when the process is alive.
     */
    get: operations["healthCheck"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/ready": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Readiness check
     * @description Returns whether the server is ready to accept traffic.
     *     Returns 503 when the tenant manager is not yet initialized.
     */
    get: operations["readinessCheck"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/license/status": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get local license status
     * @description Returns this node's current license state snapshot: activation
     *     state, entitlements, and fingerprint match. Unauthenticated,
     *     like `/health` -- this is the operator's self-serve rebind
     *     surface; `current_fingerprint` is what to paste into the
     *     licensing panel. Only mounted when the server was started with
     *     a license manager; the route is absent (404) otherwise, never
     *     501.
     */
    get: operations["getLicenseStatus"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/license/audit": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get local license audit trail
     * @description Returns this node's own local license state-transition history,
     *     newest first -- not the staff panel's cross-customer audit
     *     trail. Unauthenticated, same posture as `/v1/license/status`.
     *     Only mounted when the server was started with a license
     *     manager.
     */
    get: operations["getLicenseAudit"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List tenants
     * @description Returns all registered tenants.
     */
    get: operations["listTenants"];
    put?: never;
    /**
     * Create a tenant
     * @description Creates a new tenant. When `id` is provided the operation is
     *     idempotent -- if a tenant with that ID already exists it is returned
     *     as-is. When `id` is omitted a random UUID is generated.
     */
    post: operations["createTenant"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get a tenant
     * @description Returns tenant details by ID.
     */
    get: operations["getTenant"];
    put?: never;
    post?: never;
    /**
     * Delete a tenant
     * @description Permanently deletes a tenant and all of its indexes, users, and
     *     on-disk data. The operation is destructive and not idempotent at
     *     the data layer — re-running it after the tenant is gone returns
     *     404.
     */
    delete: operations["deleteTenant"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List indexes
     * @description Returns all indexes belonging to the specified tenant.
     */
    get: operations["listIndexes"];
    put?: never;
    /**
     * Create an index
     * @description Creates a new index under the tenant. When `id` is provided the
     *     operation is idempotent. When `id` is omitted a random ID is generated.
     */
    post: operations["createIndex"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get an index
     * @description Returns index metadata and configuration.
     */
    get: operations["getIndex"];
    put?: never;
    post?: never;
    /**
     * Delete an index
     * @description Permanently deletes an index and all its data.
     */
    delete: operations["deleteIndex"];
    options?: never;
    head?: never;
    /**
     * Update an index
     * @description Updates index metadata. Supported fields: `name`, `description`,
     *     `approximate`, `compression`.
     *
     *     All fields are optional; only the fields present in the request body
     *     are applied (pointer-semantics: omitted field ≠ zero-value).
     *
     *     **`compression` is advisory:** updating it changes the value that
     *     `LiveIndex.Compact` reads at the *next* compaction. The on-disk
     *     format of an existing compacted base layer is not changed by this
     *     call. To migrate existing data to the new mode, run
     *     `graphann recompact` offline or wait for auto-compaction to fire.
     *
     *     **`approximate`** changes propagate to a loaded LiveIndex immediately;
     *     no server restart required.
     */
    patch: operations["updateIndex"];
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/status": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get index status
     * @description Returns the current build/ready status of an index.
     */
    get: operations["getIndexStatus"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/documents": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List documents by external-ID prefix
     * @description Lists live documents whose external ID begins with `prefix`,
     *     paginated via `cursor`/`limit`. Useful for admin memory-browse
     *     UIs where the client owns the key namespace and wants to
     *     enumerate it. Requires an embedding server to be configured.
     */
    get: operations["listDocumentsByPrefix"];
    put?: never;
    /**
     * Add documents
     * @description Adds documents to the index incrementally (no full rebuild required).
     *     Each document may specify either `text` or `content` -- `content`
     *     is an alias for `text` for clients that prefer that field name.
     *
     *     Requires an embedding server to be configured.
     */
    post: operations["addDocuments"];
    /**
     * Bulk delete documents by internal IDs
     * @description Deletes multiple documents by their internal integer document IDs.
     *     All chunks belonging to the specified documents are permanently deleted.
     */
    delete: operations["bulkDeleteDocuments"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/documents/by-external-id": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Bulk delete documents by external IDs
     * @description Deletes multiple documents by their client-provided external IDs
     *     (the `id` field set when adding documents). All chunks belonging
     *     to the matched documents are permanently deleted.
     */
    delete: operations["bulkDeleteByExternalIDs"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/resources/{resourceID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Atomically upsert content under a resource ID
     * @description Tombstones any existing chunks under the given resource_id and adds
     *     the new text as fresh chunks under the same resource_id. The whole
     *     operation runs under the index write lock — no reader sees both old
     *     and new chunks live simultaneously (no partial-update window).
     *
     *     If the resource doesn't exist, behaves like a create. The response
     *     includes counts of chunks added and tombstoned plus an operation
     *     marker (`create` | `update`).
     *
     *     Tombstones are reclaimed at next compaction; until then, deleted
     *     chunks count toward delta storage but are excluded from search
     *     results via the tombstone bitmap.
     */
    put: operations["upsertResource"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/documents/{docID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get a document
     * @description Retrieves a document by ID, returning all of its non-deleted chunks
     *     ordered by chunk_index. 404 when the document has no live chunks.
     */
    get: operations["getDocument"];
    put?: never;
    post?: never;
    /**
     * Delete a document
     * @description Permanently deletes a document and all its chunks.
     */
    delete: operations["deleteDocument"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/chunks/{chunkID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get a chunk
     * @description Retrieves a specific chunk by its UUID, including text and metadata.
     */
    get: operations["getChunk"];
    put?: never;
    post?: never;
    /**
     * Delete a chunk
     * @description Permanently deletes chunks. Requires a JSON body with `chunk_ids`
     *     even though a single chunk ID is in the path (for batch compatibility).
     */
    delete: operations["deleteChunk"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/search": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Search by text query or vector
     * @description Searches the index using either a text `query` or a raw `vector`
     *     (or `vector_b64`) -- exactly one of the two families must be
     *     set. A text query is embedded server-side and searched
     *     semantically (dense HNSW); a vector search compares the given
     *     vector directly against the index. Default `k` is 10 when
     *     omitted or zero.
     *
     *     Supplying both a query and a vector is not what makes a search
     *     "hybrid" -- it is not a supported combination at all; only one
     *     of the two may be set. Hybrid retrieval is the separate `hybrid`
     *     boolean below, which applies only to text queries.
     *
     *     Set `hybrid: true` to fuse the dense (semantic) results with a
     *     BM25 lexical ranking via Reciprocal Rank Fusion (RRF), so
     *     rare-token / keyword matches surface alongside semantic ones.
     *     Text queries only -- ignored for vector-only requests. Default
     *     false (dense-only). Safe to flip on a deployment without a
     *     lexical index built: it silently falls back to dense-only
     *     results.
     */
    post: operations["search"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/search/batch": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Run several searches against one index in one request
     * @description Runs multiple independent queries against one index in a single
     *     HTTP request. Each entry in `queries` is a full `SearchRequest`,
     *     so a batch can mix text and vector queries, per-query `k`,
     *     filters, rerank and `hybrid` settings -- anything valid on
     *     `/search` is valid here. Exists because search throughput is
     *     bound by per-request socket overhead, not by the search itself;
     *     amortising many queries across one request removes most of that
     *     overhead. Intended for offline and pipeline callers (evaluation
     *     runs, reranking stages, migrations) -- interactive callers
     *     should keep using `/search` and its result cache. One query
     *     that fails does not fail the batch: its slot in `responses`
     *     carries `error` instead of `results`. Capped at 128 queries per
     *     request. Each query counts individually against the tenant's
     *     query quota.
     */
    post: operations["batchSearch"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/compact": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Trigger an immediate compaction of the index
     * @description Synchronously compacts the index, merging the live delta layer into
     *     a new base. The compaction respects the index's stored `compression`
     *     field — recompute-mode indexes stay recompute-mode after compact;
     *     PQ indexes stay PQ. To change compression mode for an existing
     *     index, use the offline `graphann recompact` CLI tool.
     *
     *     Two-delta safety: writes during compaction land in a fresh delta
     *     and are preserved through the swap. No acked write is lost.
     *
     *     Auto-compaction triggers (size threshold / delta-to-base ratio /
     *     pending delta-chunk count / max delta age / daily schedule) on the
     *     server can fire compaction without operator intervention; this
     *     endpoint is for explicit/manual invocation.
     *
     *     The count trigger measures *pending delta chunks* — live plus
     *     tombstoned (`DeltaChunks + DeletedChunks`) — not tombstones alone.
     *     Unlike the ratio trigger it is not gated by a minimum base size, so
     *     it reaches small-base indexes the ratio gate excludes by design. The
     *     age trigger only fires on an index that has pending delta work, so
     *     an untouched index is never rewritten on a timer.
     *
     *     Concurrency: only one compaction runs per index at a time. The HTTP
     *     path and the auto-compaction scheduler share a single source of
     *     truth via `CompactionScheduler.IsCompacting`. A second request for
     *     the same index while one is already in flight returns 409 Conflict.
     */
    post: operations["compactIndex"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/compact-all": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Queue compaction for every index in a tenant
     * @description Queues every index owned by the tenant onto the compaction
     *     scheduler; indexes compact one at a time. An index already
     *     queued or in flight is reported in `skipped` rather than
     *     re-queued. Requires the compaction scheduler to be wired --
     *     returns 409 otherwise ("this server was started without it").
     *     Track progress via `GET /v1/jobs`.
     */
    post: operations["compactAllIndexes"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/clear": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Clear index data
     * @description Removes all indexed data (chunks, graph, embeddings) while keeping
     *     the index configuration and metadata intact.
     */
    post: operations["clearIndex"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/live-stats": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get live index statistics
     * @description Returns detailed statistics for a live (in-memory) index including
     *     base/delta chunk counts, deleted chunks, and dirty state. If the index
     *     is not loaded as a live index, returns basic metadata from disk.
     */
    get: operations["getLiveIndexStats"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/flush": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Persist the live index delta
     * @description Persists in-memory changes to disk. Pairs with `defer_save` on
     *     `AddDocumentsRequest`: when ingest defers the per-batch save to
     *     avoid an O(N^2) full-delta re-save on large loads, the data
     *     stays searchable in memory but is NOT durable until this
     *     endpoint runs. Also required after a `bulk` ingest, where the
     *     delta HNSW graph itself is deferred and built once, concurrently,
     *     here -- bulk-ingested data is not searchable until this endpoint
     *     runs.
     */
    post: operations["flushIndex"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/rebuild-graph": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Rebuild the delta HNSW graph in place
     * @description Rebuilds an index's delta HNSW graph in place from its stored
     *     embeddings, using the current HNSW defaults (heuristic neighbor
     *     selection, concurrent one-shot build), and persists the result.
     *     Migration path for indexes ingested before the 2026-06 neighbor-
     *     selection fix (fragmented delta graphs, degraded recall) --
     *     operators POST here once per index instead of re-ingesting.
     *     Loads the live index first if it is not already resident.
     */
    post: operations["rebuildIndexGraph"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/import": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Import documents (auto-process)
     * @description Queues documents for import and automatically starts background
     *     processing (embedding, indexing, compaction). Returns
     *     immediately with status `processing`. Use the `/pending` endpoint
     *     to check progress.
     */
    post: operations["importDocuments"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/pending": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get pending queue status
     * @description Returns the number of documents waiting to be processed.
     */
    get: operations["getPendingStatus"];
    put?: never;
    post?: never;
    /**
     * Clear pending queue
     * @description Discards all pending documents without processing them.
     */
    delete: operations["clearPending"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/process": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Process pending queue
     * @description Synchronously processes all pending documents: embeds them, adds
     *     them to the index, and returns the resulting chunk IDs.
     */
    post: operations["processPending"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/orgs/{orgID}/documents": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Sync documents to an org
     * @description Unified document ingestion endpoint for organizations. Routes
     *     documents to either a **shared** org-level index (with deduplication
     *     by `resource_id`) or a **personal** user-level index, based on the
     *     `shared` flag.
     *
     *     Triggers debounced auto-compaction after ingestion.
     */
    post: operations["syncDocuments"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/orgs/{orgID}/users/{userID}/search": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Multi-index search
     * @description Searches across all of a user's accessible content within an org.
     *     This includes the user's personal indexes and any shared indexes
     *     they have access to, filtered by RBAC rules.
     *
     *     By default returns **all** relevant results from **all** discovered
     *     source types. Use `sources` to restrict to specific integrations.
     *     Results are sorted by distance (best match first) and deduplicated
     *     by `content_id` within each source type.
     */
    post: operations["searchMultiIndex"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/orgs/{orgID}/users/{userID}/indexes": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List user indexes
     * @description Returns all personal indexes for a user within an org.
     */
    get: operations["listUserIndexes"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/orgs/{orgID}/shared/indexes": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List shared indexes
     * @description Returns all shared indexes for the org.
     */
    get: operations["listSharedIndexes"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/embedding-model": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Hot-swap embedding model (async)
     * @description Queues an async re-embed of every chunk in the index against a
     *     new embedding backend / model. Returns immediately with a
     *     `job_id` that can be polled via `GET /v1/jobs/{jobID}`.
     *
     *     Authorization: requires `Admin` or `Editor` role when auth is
     *     active. In permissive (no-auth) mode this check is skipped.
     *
     *     Conflict semantics: if a reembed job for this index is already
     *     queued or running the request is rejected with 409 and the
     *     existing job id is reported under `error.details.job_id`.
     *
     *     Backends accepted over HTTP are intentionally narrower than the
     *     CLI: `ollama`, `openai`, `local_onnx`. `mock` is rejected.
     */
    patch: operations["switchEmbeddingModel"];
    trace?: never;
  };
  "/v1/jobs": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List jobs across every tenant (admin only)
     * @description Lists jobs across all tenants. Requires `Admin` role when auth
     *     is active. Permissive (no-auth) mode allows access. Supports
     *     `status`, `cursor`, and `limit` query parameters.
     */
    get: operations["listAllJobs"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/jobs/{jobID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get a job by ID
     * @description Returns the public view of a job (id, kind, tenant/index,
     *     status, progress, timestamps, error). API keys passed when the
     *     job was created are NEVER echoed back.
     *
     *     Authorization: when auth is active the request must be from
     *     the same tenant that owns the job; otherwise 403 is returned.
     */
    get: operations["getJob"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/jobs": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List jobs for a tenant
     * @description Lists jobs scoped to a single tenant. Same query parameters as
     *     `GET /v1/jobs`.
     */
    get: operations["listTenantJobs"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/gc": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Run TTL garbage collection on a single index
     * @description Triggers a TTL sweep over the named index. Documents whose
     *     `expires_at` has passed are tombstoned and become eligible for
     *     the next compaction. Returns the number of expired chunks
     *     observed. Manual replacement for the background sweep on
     *     demand — operators may call this after a bulk ingest with TTL
     *     instead of waiting for the periodic timer.
     */
    post: operations["runIndexGC"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/admin/gc": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Run TTL garbage collection across every loaded index
     * @description Cluster-wide TTL sweep. Iterates all loaded indexes and tombstones
     *     documents past their `expires_at`. Same per-index behaviour as
     *     `POST /v1/tenants/{tenantID}/indexes/{indexID}/gc` but takes the
     *     union across the manager's loaded set.
     */
    post: operations["runGlobalGC"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/admin/cleanup-orphans": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Remove orphan compaction directories
     * @description Sweeps `data/.../compaction-tmp-*` directories left behind by
     *     crashed or interrupted compactions. Removes only directories
     *     older than the cutoff (default 1 h) so concurrent in-flight
     *     compactions are not affected. Returns the list of removed paths
     *     and the total bytes freed.
     */
    post: operations["cleanupOrphans"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/admin/embed-space": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Fleet-wide embedding-space observability
     * @description Answers "how many indexes are actually being fingerprint-checked,
     *     and which ones are not" without reading logs or shelling into
     *     the box. One row per catalog index (cold indexes included --
     *     their on-disk header is peeked, not loaded); `sum(counts.values())`
     *     always equals `len(indexes)`.
     */
    get: operations["getEmbedSpaceAdmin"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/cluster/nodes": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List cluster nodes + Raft leader (Admin only)
     * @description Returns the current gossip member list with each node's last-seen
     *     timestamp, plus the current Raft leader id. When auth is active
     *     the request must come from a user with `Admin` role.
     *
     *     Single-node / non-clustered deployments return 200 with an empty
     *     node list and `leader` = "" so admin UIs can detect cluster mode
     *     without speculative retries on 503.
     */
    get: operations["listClusterNodes"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/cluster/shards": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List shard placement (Admin only)
     * @description Returns the current shard placement map: per-shard primary,
     *     replica list, and zone placement. Read-only — placement changes
     *     go through the gRPC control plane.
     */
    get: operations["listClusterShards"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/cluster/health": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Cluster health probe
     * @description Cheap aggregate cluster health check. Intentionally
     *     unauthenticated — matches `/metrics` policy so liveness probes
     *     and reverse proxies can wire it up without secret rotation.
     *
     *     Returns 200 in `ok` and `degraded` states; 503 in `unhealthy`
     *     (no nodes alive or no Raft leader). Single-node / non-clustered
     *     deployments return 200 with `cluster_size` = 0.
     */
    get: operations["clusterHealth"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/indexes/{indexID}/backups": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create an index backup
     * @description Snapshots the index into the configured filesystem backup
     *     storage and returns the new backup id plus its manifest. Only
     *     registered when the server was started with `--backup-dir`; a
     *     registered-but-disabled deployment answers every backup route
     *     with 501 so clients can distinguish "backups are off" from
     *     "route missing" (404).
     */
    post: operations["createBackup"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/backups": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List a tenant's backups
     * @description Returns every backup summary for the tenant. NOTE:
     *     `BackupSummary` has no JSON struct tags on the server, so its
     *     fields serialize with their Go field names (`ID`, `TenantID`,
     *     `IndexID`, `CreatedAt`, `TotalSize`, `NumChunks`) rather than
     *     the snake_case used everywhere else in this API.
     */
    get: operations["listBackups"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/backups/{backupID}/restore": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Restore a backup into an index
     * @description Restores the named backup into the destination index given by
     *     `dest_index` in the body; the destination tenant is the path
     *     tenant. `backupID` is percent-encoded by the client because a
     *     backup id contains slashes.
     */
    post: operations["restoreBackup"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/backups/{backupID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Delete a backup
     * @description Permanently deletes a backup from storage. `backupID` is
     *     percent-encoded by the client because a backup id contains
     *     slashes.
     */
    delete: operations["deleteBackup"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/api-keys": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List API keys
     * @description Returns every API key owned by the tenant. Hash and salt are
     *     intentionally omitted; plaintext is unrecoverable post-create.
     */
    get: operations["listAPIKeys"];
    put?: never;
    /**
     * Create an API key
     * @description Provisions a new API key for a user inside the tenant. The
     *     plaintext token is returned EXACTLY ONCE in the `plaintext`
     *     field of the response — the server only persists its argon2id
     *     hash. Lose the plaintext, rotate the key.
     */
    post: operations["createAPIKey"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/tenants/{tenantID}/api-keys/{keyID}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Revoke an API key
     * @description Permanently deletes the named key. Returns 204 on success and
     *     404 when the key was already revoked or never existed.
     */
    delete: operations["revokeAPIKey"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/orgs/{orgID}/llm-settings": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get LLM settings
     * @description Returns the LLM configuration for the org. The `api_key` field
     *     is masked (`***` + last four characters) so secrets never leave
     *     the server in plaintext. Returns the package defaults when the
     *     org has no tenant yet — no 404 so the SDK can render a settings
     *     UI on first load.
     */
    get: operations["getLLMSettings"];
    put?: never;
    post?: never;
    /**
     * Reset LLM settings to defaults
     * @description Replaces the stored settings with the package defaults
     *     (provider=ollama, model=llama3.2:3b, base_url=http://localhost:11434).
     *     Idempotent — returns the defaults whether or not the org had
     *     custom settings.
     */
    delete: operations["deleteLLMSettings"];
    options?: never;
    head?: never;
    /**
     * Update LLM settings (partial merge)
     * @description Merges the request body into the existing settings. Fields
     *     omitted from the body keep their previous values. Echoing the
     *     masked sentinel back into `api_key` preserves the stored key —
     *     round-tripping a GET response into PATCH is safe.
     */
    patch: operations["updateLLMSettings"];
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    ErrorEnvelope: {
      error: components["schemas"]["APIError"];
    };
    APIError: {
      /**
       * @description Machine-readable error code.
       * @enum {string}
       */
      code:
        | "internal_error"
        | "bad_request"
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "conflict"
        | "quota_exceeded"
        | "rate_limited"
        | "validation_error"
        | "index_not_ready"
        | "index_building"
        | "service_unavailable"
        | "payload_too_large"
        | "not_implemented";
      /** @description Human-readable error message. */
      message: string;
      /** @description Optional structured details about the error. */
      details?: unknown;
    };
    HealthResponse: {
      /** @enum {string} */
      status?: "healthy";
    };
    ReadyResponse: {
      /** @enum {string} */
      status?: "ready" | "not ready";
      /** @description Reason when not ready. */
      reason?: string;
    };
    CreateTenantRequest: {
      /** @description Optional custom tenant ID for deterministic creation (idempotent). */
      id?: string;
      /** @description Human-readable tenant name. */
      name: string;
    };
    TenantResponse: {
      id?: string;
      name?: string;
      /** Format: date-time */
      created_at?: string;
    };
    TenantDetailResponse: {
      id?: string;
      name?: string;
      /** Format: date-time */
      created_at?: string;
      /** Format: date-time */
      updated_at?: string;
    };
    /**
     * @description One element of the tenant listing. This is NOT TenantDetailResponse:
     *     the listing enriches each tenant with `index_count` so admin UIs
     *     avoid one request per tenant, and includes the sanitized metadata
     *     map. GET /v1/tenants/{tenantID} sends neither field.
     */
    TenantListEntry: {
      id?: string;
      name?: string;
      /** Format: date-time */
      created_at?: string;
      /** Format: date-time */
      updated_at?: string;
      /**
       * @description Number of indexes owned by this tenant. Best-effort: a failed
       *     lookup reports 0 for that tenant rather than failing the listing.
       */
      index_count?: number;
      /**
       * @description Operator-set tenant metadata, with any embedded credentials
       *     masked. Absent when the tenant has none.
       */
      metadata?: {
        [key: string]: string;
      };
    };
    ListTenantsResponse: {
      tenants?: components["schemas"]["TenantListEntry"][];
      total?: number;
    };
    /**
     * @description On-disk compression mode for index embeddings. Determines how
     *     compaction persists per-vector data and consequently the storage
     *     footprint and search-time behavior.
     *
     *     - `scalar`: scalar-quantized codes.
     *     - `binary`: binary-quantized codes.
     *     - `pq`: product-quantized codes.
     *     - `recompute`: recomputes embeddings from stored chunk text.
     *
     *     The internal legacy `none` mode is not selectable through this API.
     *
     *     Empty string defers to the server's `--default-compression` flag
     *     (default: `recompute`).
     *
     *     See `docs/COMPRESSION.md` for trade-offs, scale-dependent storage
     *     math, and the migration playbook.
     * @enum {string}
     */
    Compression: "" | "scalar" | "binary" | "pq" | "recompute";
    CreateIndexRequest: {
      /** @description Optional custom index ID for deterministic creation (idempotent). */
      id?: string;
      /** @description Human-readable index name. */
      name: string;
      /** @description Optional description. */
      description?: string;
      /**
       * @description Compression mode for the new index. Optional; when omitted the
       *     server's `--default-compression` value is used. Once set,
       *     controls the on-disk format produced by every subsequent
       *     compaction. To change mode after creation use the offline
       *     `graphann recompact` CLI tool.
       */
      compression?: components["schemas"]["Compression"];
      /**
       * @description If true, skip the exact rerank step during PQ-mode search
       *     (TwoLevelSearcher.RerankRatio = 0). Recall drops ~1-2%;
       *     latency drops 10-50x on the rerank-bound path. No-op for
       *     non-PQ compression modes (`recompute`, `none`, `scalar`,
       *     `binary`) — those have no rerank step to skip. Defaults to
       *     false. See `docs/COMPRESSION.md` § "Approximate-only mode".
       */
      approximate?: boolean;
    };
    UpdateIndexRequest: {
      /** @description New index name. */
      name?: string;
      /** @description New description. */
      description?: string;
      /**
       * @description When true, enables approximate-only PQ-mode search: the exact
       *     rerank step is skipped (TwoLevelSearcher.RerankRatio = 0).
       *     Recall drops ~1-2%; latency drops 10-50x on the rerank-bound
       *     path. No-op for non-PQ compression modes. Change propagates to
       *     a loaded LiveIndex immediately — no restart required.
       */
      approximate?: boolean;
      /**
       * @description Advisory compression preference for the next compaction. Updating
       *     this field does NOT migrate existing on-disk data — it only sets
       *     the mode that LiveIndex.Compact will use the next time it runs.
       *     To migrate existing data immediately, run `graphann recompact`
       *     offline or trigger a manual compaction.
       * @enum {string}
       */
      compression?: "" | "scalar" | "binary" | "pq" | "recompute";
      /**
       * @description Per-index embedding backend override. Remote backends only --
       *     per-index local_onnx instances are deliberately unsupported;
       *     use the process embedder for local models. Setting this to ""
       *     clears the override back to the process-wide embedder.
       * @enum {string}
       */
      embedding_backend?: "" | "ollama" | "openai";
      /**
       * @description Backend model identifier (e.g. "text-embedding-3-small",
       *     "intfloat/multilingual-e5-small"). e5-family models get the
       *     query:/passage: intent prefixes applied automatically by the
       *     openai backend preset.
       */
      embedding_model?: string;
      /**
       * @description Optional override of the backend base URL. SSRF-validated at
       *     PATCH time (public http/https hosts only) and re-guarded at
       *     connect time, so it cannot point at loopback/RFC1918/metadata
       *     ranges.
       */
      embedding_endpoint?: string;
      /** @description Expected output dimension for the per-index embedding override. */
      embedding_dimension?: number;
      /**
       * @description ENV VAR NAME holding the backend key -- never send the key
       *     itself in this field.
       */
      embedding_api_key_env?: string;
    };
    /** @description Full index metadata as stored by the tenant manager. */
    IndexInfo: {
      id?: string;
      tenant_id?: string;
      name?: string;
      description?: string;
      /** @enum {string} */
      status?: "pending" | "building" | "ready" | "error" | "deleted";
      error?: string;
      num_docs?: number;
      num_chunks?: number;
      dimension?: number;
      /** Format: date-time */
      created_at?: string;
      /** Format: date-time */
      updated_at?: string;
      /**
       * Format: date-time
       * @description Wall-clock time of the most recent successful compaction.
       *     Absent when the index has never been compacted (either
       *     genuinely fresh, or compacted before this field existed --
       *     callers fall back to `created_at` in that case).
       */
      last_compacted_at?: string;
      /** @description User ID of the index's creator, if known. */
      created_by?: string;
      /** @description On-disk directory the index is stored under. */
      path?: string;
      /** @description Arbitrary operator-set key/value metadata for this index. */
      metadata?: {
        [key: string]: string;
      };
      /**
       * @description Currently configured compression mode. Reflects the value set at
       *     creation time (or the server default when the request omitted it).
       *     Empty string indicates a legacy index that predates this field; it
       *     will adopt the server default at the next compaction.
       */
      compression?: components["schemas"]["Compression"];
      /**
       * @description True when this index is in approximate-only mode: PQ-mode search
       *     skips the exact rerank step. See `CreateIndexRequest.approximate`
       *     for the full contract. Always false for non-PQ indexes.
       */
      approximate?: boolean;
      /**
       * @description True once the index has ingested at least one client-supplied
       *     (precomputed) vector -- meaning the stored vectors/codes live
       *     in the CLIENT's embedding space, not the server embedder's.
       *     Once set, compacted search paths rank candidates in the
       *     index's own code space and never re-embed candidate texts for
       *     reranking.
       */
      vectors_external?: boolean;
      /**
       * @description Per-index embedding backend override, if configured. Empty
       *     for the default (process-wide embedder). See
       *     `UpdateIndexRequest.embedding_backend`.
       */
      embedding_backend?: string;
      /** @description Per-index embedding model identifier, if `embedding_backend` is set. */
      embedding_model?: string;
      /** @description Per-index embedding backend base URL override, if set. */
      embedding_endpoint?: string;
      /** @description Expected output dimension for the per-index embedding override, if set. */
      embedding_dimension?: number;
      /** @description ENV VAR NAME holding the per-index embedding backend key, if set. */
      embedding_api_key_env?: string;
    };
    /**
     * @description Status of one index, including its embedding-space observability
     *     state. The shape is identical whether the index is loaded or cold --
     *     a cold answer is peeked from the on-disk header, so a status query
     *     never loads an index.
     */
    IndexStatusResponse: {
      index_id?: string;
      /** @enum {string} */
      status?: "pending" | "building" | "ready" | "error" | "deleted";
      error?: string;
      /**
       * @description Embedding-space classification of this index.
       * @enum {string}
       */
      embed_space_state?:
        | "unknown"
        | "verified"
        | "mismatch"
        | "external_unverified"
        | "external_agree"
        | "external_diverged";
      /** @description The index's own stored embedding fingerprint. */
      embed_fingerprint?: string;
      /** @description Fingerprint of the embedder this server is currently serving with. */
      server_embed_fingerprint?: string;
      /**
       * @description Mismatch policy in force for THIS index, i.e. the global policy
       *     after any per-index allow-list override.
       * @enum {string}
       */
      embed_space_policy?: "warn" | "refuse_search" | "refuse_open";
      /** @description Human-readable detail for the state. Empty string when there is none. */
      embed_space_detail?: string;
      /**
       * Format: date-time
       * @description When the state was last resolved. Absent if never checked.
       */
      embed_space_checked_at?: string;
    };
    ListIndexesResponse: {
      indexes?: components["schemas"]["IndexInfo"][];
      total?: number;
    };
    /**
     * @description A document to add to an index. The text content can be supplied in
     *     either `text` or `content` -- `content` is an alias for `text`.
     */
    Document: {
      /** @description Optional custom document ID. */
      id?: string;
      /** @description Document text content. */
      text?: string;
      /** @description Alias for `text`. If both are provided, `text` takes precedence. */
      content?: string;
      /** @description Arbitrary metadata attached to the document. */
      metadata?: unknown;
      /** @description Repository ID for RBAC filtering. */
      repo_id?: string;
      /** @description File path within the repository. */
      file_path?: string;
      /** @description Git commit SHA. */
      commit_sha?: string;
      /**
       * @description When true, existing chunks with the same external ID are
       *     deleted before this document is queued, making ingest
       *     idempotent by key. Replaces the semantic
       *     DeleteByQuery-then-Import pattern for clients that want
       *     replace-on-reimport semantics.
       */
      upsert?: boolean;
      /**
       * Format: date-time
       * @description Optional RFC3339 timestamp after which this document's
       *     chunks are hidden from search and eligible for GC. Absent
       *     means never.
       */
      expires_at?: string;
      /**
       * @description Optional precomputed embedding. When every document in the
       *     request carries a vector, ingest skips internal embedding
       *     and inserts the vectors directly.
       */
      vector?: number[];
      /**
       * @description The same embedding as `vector`, base64-encoded little-endian
       *     float32 (numpy `astype('<f4').tobytes()` /
       *     `binary.LittleEndian`). An alternative to `vector` for bulk
       *     loads that is cheaper to decode. Set one or the other, never
       *     both.
       */
      vector_b64?: string;
    };
    UpsertResourceRequest: {
      /** @description Full text content for this resource version. */
      text: string;
      /** @description Optional stable external ID (e.g. document UUID). Passed through to chunk metadata. */
      external_id?: string;
      /** @description Optional key/value metadata attached to all chunks. */
      metadata?: {
        [key: string]: string;
      };
      repo_id?: string;
      file_path?: string;
      commit_sha?: string;
      source_type?: string;
      owner_user_id?: string;
      title?: string;
      url?: string;
    };
    UpsertResourceResponse: {
      /** @description The resource ID that was upserted. */
      resource_id?: string;
      index_id?: string;
      /** @description Number of new chunks created. */
      chunks_added?: number;
      /** @description Number of previously-live chunks now tombstoned (reclaimed at next compaction). */
      chunks_tombstoned?: number;
      /**
       * @description `create` when no prior chunks existed; `update` when old chunks were tombstoned.
       * @enum {string}
       */
      operation?: "create" | "update";
    };
    AddDocumentsRequest: {
      documents: components["schemas"]["Document"][];
      /**
       * @description Skips the per-batch full-delta save during a bulk load: data
       *     stays in memory (index marked dirty) and is persisted once
       *     the caller POSTs to `.../flush`. Avoids an O(N^2) full-delta
       *     re-save on every ingest request. Also settable via the
       *     `?defer_save=true` query param. Default false preserves the
       *     per-batch save behavior.
       * @default false
       */
      defer_save: boolean;
      /**
       * @description Enables bulk-ingest mode: in addition to deferring the
       *     per-batch save (`bulk` implies `defer_save`), the per-node
       *     HNSW graph insert is deferred and the delta graph is built
       *     once, concurrently, when the caller POSTs to `.../flush`.
       *     The fast path for large loads. IMPORTANT: bulk-ingested data
       *     is NOT searchable until `.../flush` builds the graph. Also
       *     settable via the `?bulk=true` query param. Default false
       *     preserves the immediately-searchable per-node insert
       *     behavior.
       * @default false
       */
      bulk: boolean;
    };
    AddDocumentsResponse: {
      /** @description Number of documents added. */
      added?: number;
      index_id?: string;
      /**
       * @description IDs of created chunks. These are store.ChunkID values, which are
       *     STRINGS -- earlier revisions of this document typed them as
       *     integers, which no server has ever sent.
       */
      chunk_ids?: string[];
      /**
       * @description Present only when the server minted external IDs during this
       *     ingest. A sharded index requires an external ID per document (it
       *     is the routing key), so documents that arrive without one are
       *     given one; this returns the durable IDs. Absent entirely for
       *     unsharded ingests and for sharded ingests where the client
       *     supplied every ID.
       */
      external_ids?: string[];
    };
    /**
     * @description One chunk of a retrieved document. NOT ChunkResponse: this carries
     *     `uuid` plus the RBAC/source fields and omits `document_id`, which the
     *     enclosing GetDocumentResponse states once.
     */
    GetDocumentChunk: {
      chunk_id?: number;
      uuid?: string;
      text?: string;
      chunk_index?: number;
      /** @description Start byte offset in the original document. */
      start?: number;
      /** @description End byte offset in the original document. */
      end?: number;
      repo_id?: string;
      file_path?: string;
      commit_sha?: string;
    };
    /** @description Every non-deleted chunk of a document, ordered by chunk_index. */
    GetDocumentResponse: {
      index_id?: string;
      document_id?: number;
      /** @description Taken from the first chunk; every chunk of a document shares it. */
      external_id?: string;
      chunks?: components["schemas"]["GetDocumentChunk"][];
      total_chunks?: number;
    };
    DeleteDocumentResponse: {
      deleted_chunks?: number;
      document_id?: number;
      index_id?: string;
    };
    BulkDeleteDocumentsRequest: {
      document_ids: number[];
    };
    BulkDeleteDocumentsResponse: {
      index_id?: string;
      documents_deleted?: number;
      chunks_deleted?: number;
      /** @description Map of document ID to number of chunks deleted. */
      deleted_per_doc?: {
        [key: string]: number;
      };
    };
    BulkDeleteByExternalIDsRequest: {
      /** @description Client-provided external IDs to delete. */
      external_ids: string[];
    };
    BulkDeleteByExternalIDsResponse: {
      index_id?: string;
      documents_deleted?: number;
      chunks_deleted?: number;
      /** @description Map of external ID to number of chunks deleted. */
      deleted_per_id?: {
        [key: string]: number;
      };
    };
    ChunkResponse: {
      chunk_id?: number;
      text?: string;
      document_id?: number;
      chunk_index?: number;
      /** @description Start byte offset in the original document. */
      start?: number;
      /** @description End byte offset in the original document. */
      end?: number;
    };
    DeleteChunksRequest: {
      chunk_ids: number[];
    };
    DeleteChunksResponse: {
      deleted?: number;
      index_id?: string;
    };
    SearchFilter: {
      /**
       * @description Filter results to only include chunks from these repository IDs.
       *     If empty, no filtering is applied.
       */
      repo_ids?: string[];
      /**
       * @description Generic field-equality filter over ChunkMetadata fields. Every
       *     entry must match for a chunk to pass (AND semantics). An empty
       *     or absent map matches all chunks. An unknown key excludes all
       *     chunks (defensive default).
       *
       *     Supported keys: author, author_email, title, url, content_type,
       *     content_id, thread_id, source_type, source_id, source_name,
       *     connector_id, repo_id, file_path, commit_sha, owner_user_id,
       *     resource_id, external_id, shared ("true"/"false"),
       *     document_id (decimal string).
       * @example {
       *       "author": "alice",
       *       "content_type": "email"
       *     }
       */
      equals?: {
        [key: string]: string;
      };
      /**
       * @description Drops the chunk text from every result. Off by default, so
       *     an existing client sees exactly what it saw before. Worth
       *     setting for a caller that already holds the text -- a RAG
       *     pipeline reading from its own store, or a reranking stage
       *     keyed on ids. At k=10, text is 75% of the response body;
       *     skipping it also skips the per-result zstd decompression of
       *     the chunk text store, not just the bytes on the wire.
       * @default false
       */
      omit_text: boolean;
      /**
       * @description Removes chunks whose external ID is in this list. Use case:
       *     strip well-known synthetic docs (e.g. "__seed__") from
       *     results.
       */
      exclude_external_ids?: string[];
      /**
       * @description Requires each key/value to match the chunk's sidecar
       *     metadata exactly. Keys absent from the chunk's sidecar fail
       *     the filter. Empty/absent map disables this filter.
       */
      metadata_filter?: {
        [key: string]: unknown;
      };
    };
    SearchRequest: {
      /** @description Text query for semantic search. */
      query?: string;
      /**
       * @description Raw embedding vector for nearest-neighbor search. Mutually
       *     exclusive with `vector_b64` -- set one or the other, never
       *     both.
       */
      vector?: number[];
      /**
       * @description The query vector as base64-encoded little-endian float32,
       *     the same encoding accepted on ingest -- an alternative to
       *     `vector` that is cheaper to decode (query JSON decoding
       *     measured at 17.5% of server CPU under load). Mutually
       *     exclusive with `vector` -- set one or the other, never both.
       */
      vector_b64?: string;
      /**
       * @description Maximum number of results to return.
       * @default 10
       */
      k: number;
      filter?: components["schemas"]["SearchFilter"];
      /**
       * @description When true, rescore the top-`candidate_k` HNSW candidates with the
       *     server-configured cross-encoder reranker and return the top-`rerank_k`
       *     (or top-`k` if `rerank_k` is unset) by reranker score. Silently no-op
       *     when the server has no reranker configured (`--reranker-url` unset),
       *     so flipping this on a non-rerank-aware deployment is safe.
       *
       *     Reranking only applies to the text-`query` path. Vector-only
       *     requests ignore this flag (no text query to feed the cross-encoder).
       * @default false
       */
      rerank: boolean;
      /**
       * @description Size of the first-stage candidate pool fed to the reranker. Effective
       *     only when `rerank=true`. Defaults to `max(4*k, 50)`. Server clamps to
       *     `[k, 1000]`.
       */
      candidate_k?: number;
      /**
       * @description Number of results to return AFTER reranking. Effective only when
       *     `rerank=true`. Defaults to `k`.
       */
      rerank_k?: number;
      /**
       * @description Per-query HNSW search breadth (candidate list size). 0 (the
       *     default) uses the server default. Clamped to a maximum of
       *     2000.
       */
      ef_search?: number;
      /**
       * @description Fuses the dense (semantic) results with a BM25 lexical
       *     ranking via Reciprocal Rank Fusion (RRF), so rare-token /
       *     keyword matches surface alongside semantic ones. Applies to
       *     text `query` searches only -- ignored for vector-only
       *     requests. Default false = dense-only. Safe to flip: falls
       *     back to dense-only results if the lexical index can't be
       *     built.
       * @default false
       */
      hybrid: boolean;
    };
    SearchResult: {
      /**
       * @description Document identifier. Returns the client-provided external ID
       *     when available, otherwise falls back to the integer chunk index
       *     formatted as a string.
       */
      id?: string;
      text?: string;
      /**
       * Format: float
       * @description First-stage cosine similarity (higher is better). Always
       *     populated, regardless of whether reranking ran. Clients can
       *     rely on this single scale across rerank and non-rerank
       *     requests.
       */
      score?: number;
      /**
       * Format: float
       * @description Cross-encoder relevance score, in the reranker's native
       *     scale (typically roughly -10 to 10 for bge-reranker-v2-m3).
       *     Present only when the request set `rerank=true` AND the
       *     server applied the reranker successfully. Absent when the
       *     server has no reranker, the request didn't ask for rerank,
       *     or the reranker errored and the server fell back to
       *     first-stage results. Clients that want the post-rerank
       *     order should sort by `rerank_score` when present and fall
       *     back to `score` otherwise.
       */
      rerank_score?: number;
      /** @description Chunk metadata merged with arbitrary user metadata. */
      metadata?: {
        /** @description Internal document ID. */
        document_id?: number;
        /** @description Chunk index within the document. */
        chunk_index?: number;
        /** @description Repository ID for RBAC filtering. */
        repo_id?: string;
        /** @description File path within the repository. */
        file_path?: string;
        /** @description Git commit SHA. */
        commit_sha?: string;
      } & {
        [key: string]: unknown;
      };
    };
    SearchResponse: {
      results?: components["schemas"]["SearchResult"][];
      total?: number;
      /** @description Whether one or more shards did not return complete results. */
      partial?: boolean;
      /** @description Total shards targeted by a sharded search. */
      shards_total?: number;
      /** @description Shards that returned complete results. */
      shards_ok?: number;
      /** @description Identifiers of degraded shards, when present. */
      degraded_shards?: string[];
      /** @description Whether the server applied reranking. May be absent on older servers or when reranking was not requested. */
      rerank_applied?: boolean;
    };
    CompactResponse: {
      index_id?: string;
      /**
       * @description Always `compacting`, never `compacted`: compaction runs in the
       *     background and nothing has been merged when this returns. Track
       *     completion via GET /v1/jobs.
       * @enum {string}
       */
      status?: "compacting";
      message?: string;
    };
    ClearResponse: {
      index_id?: string;
      /** @enum {string} */
      status?: "cleared";
      message?: string;
    };
    /**
     * @description When `is_live` is true, detailed live index stats are returned.
     *     When false, only basic metadata from disk is included.
     */
    LiveStatsResponse: {
      index_id?: string;
      /** @description Whether the index is currently loaded in memory. */
      is_live?: boolean;
      /** @description Embedding dimension (present in both live and non-live responses). */
      dimension?: number;
      /** @description Number of chunks in the compacted base graph. */
      base_chunks?: number;
      /** @description Number of chunks in the uncompacted delta layer. */
      delta_chunks?: number;
      /** @description Chunks rotated out of the active delta and not yet folded into the new base by an in-flight compaction (delta-A). Already counted in total_chunks/live_chunks so those totals don't visibly drop during a compaction window; reported separately so delta_chunks keeps its established meaning (active delta-B only). Always 0 in the not-loaded fallback. */
      frozen_chunks?: number;
      /** @description Total chunks (base + delta). */
      total_chunks?: number;
      /** @description Number of deleted chunks. */
      deleted_chunks?: number;
      /** @description Active chunks (total - deleted). */
      live_chunks?: number;
      /** @description Number of documents. */
      documents?: number;
      /** @description Whether the delta layer has uncompacted changes. */
      is_dirty?: boolean;
      /**
       * Format: int64
       * @description On-disk size of the compacted base index directory.
       */
      base_bytes?: number;
      /**
       * Format: int64
       * @description On-disk size of the uncompacted delta layer files.
       */
      delta_bytes?: number;
      /**
       * Format: int64
       * @description On-disk size of embedding-derived files kept in the index (quantized codes/models, PCA, hub cache).
       */
      embedding_sidecar_bytes?: number;
      /**
       * Format: int64
       * @description Uncompressed baseline: what the live chunks' embeddings would weigh as full float32 (live_chunks * dimension * 4). Pair with index_size_bytes for the storage-savings ratio.
       */
      raw_bytes?: number;
      /**
       * Format: int64
       * @description Persisted on-disk index size (base_bytes + delta_bytes). 0 in the not-loaded fallback where a disk walk isn't performed.
       */
      index_size_bytes?: number;
      /**
       * Format: float
       * @description raw_bytes / index_size_bytes (how many times smaller the index is than the raw float32 vectors). 0 before anything is persisted.
       */
      compression_ratio?: number;
      /** @description Rebuild advisory (live responses only): number of tombstoned chunks in the compacted base. Always 0 in the not-loaded fallback. */
      base_deleted_chunks?: number;
      /**
       * Format: float
       * @description Rebuild advisory: fraction of the compacted base that is tombstoned (base_deleted_chunks / base size). Always 0 in the not-loaded fallback.
       */
      base_deleted_fraction?: number;
      /** @description Rebuild advisory: true when base_deleted_fraction exceeds the ~5% threshold. Advisory only -- the server never auto-compacts on it. Always false in the not-loaded fallback. */
      rebuild_recommended?: boolean;
      /** @description Stored chunk count (from metadata). */
      num_chunks?: number;
      /** @description Stored document count (from metadata). */
      num_docs?: number;
    };
    ImportDocumentsRequest: {
      documents: components["schemas"]["Document"][];
    };
    ImportDocumentsResponse: {
      imported?: number;
      document_ids?: number[];
      index_id?: string;
      pending_total?: number;
      /** @enum {string} */
      status?: "processing";
      message?: string;
    };
    PendingStatusResponse: {
      index_id?: string;
      pending_count?: number;
    };
    ProcessPendingResponse: {
      index_id?: string;
      processed?: number;
      chunks_created?: number;
      /** @description store.ChunkID values -- strings, as in AddDocumentsResponse. */
      chunk_ids?: string[];
    };
    ClearPendingResponse: {
      index_id?: string;
      /** @enum {string} */
      status?: "cleared";
      message?: string;
    };
    SyncDocumentInput: {
      /** @description Deduplication key. Required when `shared` is true. */
      resource_id?: string;
      /** @description Document text content. */
      text?: string;
      /**
       * @description Key-value metadata. Recognized keys include: `repo_id`,
       *     `file_path`, `commit_sha`, `title`, `author`, `url`,
       *     `resource_type`, `created_at` (RFC3339), `author_email`,
       *     `source_id`, `source_name`, `connector_id`, `content_id`,
       *     `content_type`, `thread_id`.
       */
      metadata?: {
        [key: string]: string;
      };
    };
    SyncDocumentsRequest: {
      /** @description ID of the user performing the sync. */
      user_id: string;
      /**
       * @description Integration source type (e.g. `github`, `confluence`, `slack`,
       *     `gmail`, `gdocs`).
       */
      source_type: string;
      /**
       * @description When true, documents are added to a shared org-level index with
       *     deduplication by `resource_id`. When false, documents go to the
       *     user's personal index.
       * @default false
       */
      shared: boolean;
      documents: components["schemas"]["SyncDocumentInput"][];
    };
    SyncDocumentsResponse: {
      synced?: number;
      org_id?: string;
      user_id?: string;
      source_type?: string;
      /** @enum {string} */
      index_type?: "personal" | "shared";
    };
    MultiSearchRequest: {
      /** @description Text query for semantic search. */
      query: string;
      /**
       * @description Maximum results. 0 (default) returns all relevant results with
       *     no limit.
       * @default 0
       */
      k: number;
      /**
       * @deprecated
       * @description Deprecated: use `k` instead.
       */
      max_results?: number;
      /**
       * @description Filter by source types (e.g. `["github", "slack"]`). Empty
       *     searches all discovered sources.
       */
      sources?: string[];
      /**
       * @description Search expansion factor for HNSW traversal.
       * @default 500
       */
      ef_search: number;
      /**
       * @description Include chunk text content in results.
       * @default false
       */
      include_text: boolean;
      /**
       * Format: int64
       * @description Unix timestamp -- only return results created after this time.
       */
      start_time?: number;
      /**
       * Format: int64
       * @description Unix timestamp -- only return results created before this time.
       */
      end_time?: number;
      /**
       * Format: float
       * @description Maximum cosine distance for results. Lower values mean stricter
       *     matching (0 = perfect match, 1 = orthogonal). Values less than or
       *     equal to zero are treated as the default (0.5).
       * @default 0.5
       */
      distance_threshold: number;
    };
    MultiSearchResult: {
      chunk_id?: number;
      /** @description Chunk text (only when `include_text` is true). */
      text?: string;
      /**
       * Format: float
       * @description Cosine distance from query (lower is better).
       */
      distance?: number;
      source_type?: string;
      repo_id?: string;
      /**
       * @description Metadata fields such as `file_path`, `commit_sha`, `title`,
       *     `url`, `author_name`, `author_email`, `source_id`,
       *     `source_name`, `connector_id`, `content_id`, `content_type`,
       *     `thread_id`, `resource_id`, `owner_user_id`.
       */
      metadata?: {
        [key: string]: unknown;
      };
      /**
       * Format: int64
       * @description Unix timestamp when the content was created.
       */
      created_at?: number;
      /** @description Whether this result is from a shared index. */
      shared?: boolean;
    };
    MultiSearchResponse: {
      results?: components["schemas"]["MultiSearchResult"][];
      total?: number;
      query?: string;
      org_id?: string;
      user_id?: string;
    };
    OrgIndexListResponse: {
      indexes?: components["schemas"]["IndexInfo"][];
      total?: number;
      org_id?: string;
      user_id?: string;
    };
    SharedIndexListResponse: {
      indexes?: components["schemas"]["IndexInfo"][];
      total?: number;
      org_id?: string;
    };
    DeleteTenantResponse: {
      /** @enum {boolean} */
      deleted?: true;
      tenant_id?: string;
      name?: string;
    };
    SwitchEmbeddingModelRequest: {
      /**
       * @description Destination embedding backend. The HTTP API intentionally
       *     rejects `mock` — it is CLI-only.
       * @enum {string}
       */
      embedding_backend: "ollama" | "openai" | "local_onnx";
      /** @description Destination model identifier. */
      model: string;
      /** @description Expected output dimension for the destination model. */
      dimension: number;
      /**
       * @description Optional URL (ollama / openai) or filesystem path
       *     (local_onnx) to override the default endpoint. Endpoints
       *     with shell metacharacters are rejected.
       */
      endpoint_override?: string;
      /**
       * @description Optional API key for the destination backend. Carried in
       *     memory only — never echoed back in the job JSON.
       */
      api_key?: string;
    };
    SwitchEmbeddingModelResponse: {
      job_id?: string;
      /** @enum {string} */
      status?: "queued";
    };
    JobProgress: {
      chunks_done?: number;
      chunks_total?: number;
    };
    /**
     * @description Public view of an async job. The internal `Params.APIKey` is
     *     never serialized.
     */
    Job: {
      job_id?: string;
      /** @enum {string} */
      kind?: "reembed";
      tenant_id?: string;
      index_id?: string;
      /** @enum {string} */
      status?: "queued" | "running" | "completed" | "failed";
      progress?: components["schemas"]["JobProgress"];
      /** Format: date-time */
      created_at?: string;
      /** Format: date-time */
      started_at?: string;
      /** Format: date-time */
      completed_at?: string;
      error?: string;
    };
    JobListResponse: {
      jobs?: components["schemas"]["Job"][];
      total?: number;
      /** @description Cursor to pass back as `?cursor=` for the next page. */
      next_cursor?: string;
    };
    /**
     * @description Body of `POST /v1/tenants/{tenantID}/indexes/{indexID}/gc`, written by
     *     IncrementalHandlers.RunGC.
     */
    GCResponse: {
      index_id: string;
      /** @description Number of expired documents deleted by the sweep. */
      deleted_count: number;
    };
    /**
     * @description Body of `POST /v1/admin/gc`, written by IncrementalHandlers.RunGCAll.
     *     Reports the total across every loaded index; there is no per-index
     *     breakdown and no count of indexes swept.
     */
    AdminGCResponse: {
      /** @description Total expired documents deleted across all loaded indexes. */
      deleted_count: number;
    };
    /**
     * @description Body of `POST /v1/admin/cleanup-orphans`. `min_age` and `dry_run` echo
     *     the values the server actually applied, so a caller can confirm which
     *     cutoff was used. When `dry_run` is true, `removed` lists what *would*
     *     have been removed and nothing is deleted.
     */
    AdminCleanupResponse: {
      /** @description Absolute paths removed (or, under dry_run, that would be removed). */
      removed: string[];
      /** Format: int64 */
      freed_bytes: number;
      /**
       * @description Minimum-age cutoff actually applied, as a Go duration string.
       * @example 1h
       */
      min_age: string;
      /** @description Echoes whether the sweep was a dry run. */
      dry_run: boolean;
    };
    ClusterNodeView: {
      id?: string;
      addr?: string;
      zone?: string;
      /** @enum {string} */
      state?: "alive" | "suspect" | "dead";
      /** Format: date-time */
      last_seen?: string;
    };
    ClusterShardView: {
      id?: string;
      primary?: string;
      replicas?: string[];
      zone_placement?: {
        [key: string]: string;
      };
    };
    ListClusterNodesResponse: {
      nodes?: components["schemas"]["ClusterNodeView"][];
      leader?: string;
    };
    ListClusterShardsResponse: {
      shards?: components["schemas"]["ClusterShardView"][];
      /** @description Configured replication factor. */
      rf?: number;
    };
    ClusterHealthResponse: {
      /** @enum {string} */
      status?: "ok" | "degraded" | "unhealthy";
      cluster_size?: number;
      alive_nodes?: number;
      raft_has_leader?: boolean;
      under_replicated_shards?: number;
    };
    CreateAPIKeyRequest: {
      /** @description Owning user ID. Must already exist inside the tenant. */
      user_id: string;
      /** @description Human-readable label stored alongside the key. */
      name: string;
    };
    CreateAPIKeyResponse: {
      /** @description Stable key identifier (e.g. `k_abc123`). */
      id: string;
      name: string;
      user_id: string;
      /**
       * @description The plaintext API token. RETURNED EXACTLY ONCE. The server
       *     stores only the argon2id hash; losing this value requires
       *     rotating the key.
       */
      plaintext: string;
      /** Format: date-time */
      created_at: string;
    };
    APIKeyListItem: {
      id: string;
      user_id: string;
      name: string;
      /** Format: date-time */
      created_at: string;
      /**
       * Format: date-time
       * @description Set when the key has been validated at least once.
       */
      last_used_at?: string;
    };
    ListAPIKeysResponse: {
      api_keys: components["schemas"]["APIKeyListItem"][];
    };
    LLMSettings: {
      /** @enum {string} */
      provider?: "openai" | "ollama" | "anthropic";
      model?: string;
      /**
       * @description On read this field is masked (`***` + last four characters).
       *     On write a masked sentinel preserves the existing key.
       */
      api_key?: string;
      /** @description Optional base URL override. SSRF-validated server-side. */
      base_url?: string;
      /** Format: float */
      temperature?: number;
      max_tokens?: number;
    };
    /**
     * @description Partial update body. Only the fields present here are applied;
     *     absent fields keep their previous values. Echoing the masked
     *     `api_key` value preserves the stored secret.
     */
    LLMSettingsPatch: {
      /** @enum {string} */
      provider?: "openai" | "ollama" | "anthropic";
      model?: string;
      api_key?: string;
      base_url?: string;
      /** Format: float */
      temperature?: number;
      max_tokens?: number;
    };
    LicenseEntitlements: {
      /** Format: int64 */
      max_tenants?: number;
      /** Format: int64 */
      max_memory_bytes?: number;
      max_cpu?: number;
      /** Format: int64 */
      max_disk_bytes?: number;
    };
    /** @description Snapshot of this node's current license state. */
    LicenseStatus: {
      /** @enum {string} */
      state?: "unlicensed" | "active" | "grace" | "expired" | "mismatch";
      license_id?: string;
      /**
       * Format: int64
       * @description Unix timestamp the license expires, if bound.
       */
      not_after?: number;
      entitlements?: components["schemas"]["LicenseEntitlements"];
      current_fingerprint?: string;
      /** @description Fingerprint the license is bound to, if activated. */
      bound_fingerprint?: string;
      fingerprint_match?: boolean;
      /**
       * Format: int64
       * @description Unix timestamp the grace period ends, if in the grace state.
       */
      grace_deadline?: number;
      last_error?: string;
    };
    LicenseAuditEvent: {
      /** Format: date-time */
      time?: string;
      state?: string;
      detail?: string;
    };
    ListDocumentEntry: {
      /** @description The document's external ID. */
      id?: string;
      text?: string;
      metadata?: {
        [key: string]: unknown;
      };
    };
    ListDocumentsResponse: {
      documents?: components["schemas"]["ListDocumentEntry"][];
      /** @description Cursor to pass back as `?cursor=` for the next page. Absent on the last page. */
      next_cursor?: string;
    };
    BatchSearchRequest: {
      /** @description Up to 128 independent queries, each valid on its own against `/search`. */
      queries: components["schemas"]["SearchRequest"][];
    };
    BatchSearchResult: {
      results?: components["schemas"]["SearchResult"][];
      total?: number;
      /** @description Set instead of `results`/`total` when this one query failed; the rest of the batch is unaffected. */
      error?: string;
    };
    BatchSearchResponse: {
      /** @description One entry per request query, in the same order. */
      responses?: components["schemas"]["BatchSearchResult"][];
    };
    FlushIndexResponse: {
      /** @enum {boolean} */
      flushed?: true;
    };
    RebuildGraphResponse: {
      /** @enum {boolean} */
      rebuilt?: true;
      /** @description Number of chunks the delta graph was rebuilt from. */
      chunks?: number;
      /**
       * Format: int64
       * @description Wall-clock rebuild time in milliseconds.
       */
      wall_ms?: number;
    };
    CompactAllSkipped: {
      index_id?: string;
      reason?: string;
    };
    CompactAllResponse: {
      tenant_id?: string;
      total_indexes?: number;
      /** @description IDs of indexes newly scheduled by this request. */
      queued?: string[];
      queued_count?: number;
      /** @description Indexes already queued or in flight, skipped rather than re-queued. */
      skipped?: components["schemas"]["CompactAllSkipped"][];
      skipped_count?: number;
      message?: string;
    };
    EmbedSpaceIndexRow: {
      index_id?: string;
      tenant_id?: string;
      /** @description Whether this index is currently resident in memory (vs. classified by peeking its on-disk header). */
      loaded?: boolean;
      /** @enum {string} */
      state?:
        | "unknown"
        | "verified"
        | "mismatch"
        | "external_unverified"
        | "external_agree"
        | "external_diverged";
      /** @description The index's own stored embedding fingerprint. */
      embed_fingerprint?: string;
      detail?: string;
      /**
       * Format: date-time
       * @description When this row's state was last resolved. Absent if never checked.
       */
      checked_at?: string;
    };
    EmbedSpaceAdminResponse: {
      /** @description Model name of the process-wide serving embedder. */
      server_model?: string;
      server_dimension?: number;
      server_embed_fingerprint?: string;
      /**
       * @description Fleet-level mismatch policy resolved from
       *     GRAPHANN_EMBEDDER_MISMATCH_POLICY. Global only -- per-index
       *     allow-list overrides are visible on each index's own status
       *     endpoint, not here.
       * @enum {string}
       */
      policy?: "warn" | "refuse_search" | "refuse_open";
      /**
       * @description Count of indexes per state. Always has all six
       *     EmbedSpaceState keys present, even at zero, so callers can
       *     distinguish "no indexes in this state" from "this state
       *     doesn't exist". sum(counts.values()) == len(indexes).
       */
      counts?: {
        [key: string]: number;
      };
      indexes?: components["schemas"]["EmbedSpaceIndexRow"][];
    };
    BackupChunkInfo: {
      /** @description Storage key for this chunk. */
      key?: string;
      /**
       * Format: int64
       * @description Compressed on-storage size in bytes.
       */
      size?: number;
      sha256?: string;
      /** Format: int64 */
      uncompressed_size?: number;
    };
    BackupMeta: {
      tenant_id?: string;
      index_id?: string;
      graphann_version?: string;
      description?: string;
      labels?: {
        [key: string]: string;
      };
    };
    BackupManifest: {
      version?: number;
      /** @description Same value as the backup id returned alongside the manifest. */
      id?: string;
      /** Format: date-time */
      created_at?: string;
      meta?: components["schemas"]["BackupMeta"];
      chunks?: components["schemas"]["BackupChunkInfo"][];
      /** Format: int64 */
      total_size?: number;
    };
    CreateBackupResponse: {
      backup_id?: string;
      manifest?: components["schemas"]["BackupManifest"];
    };
    /**
     * @description Condensed view returned by list-backups. NOTE: this struct has
     *     no JSON tags on the server, so the field names below are the Go
     *     field names verbatim (capitalized), not the snake_case used
     *     elsewhere in this API.
     */
    BackupSummary: {
      ID?: string;
      TenantID?: string;
      IndexID?: string;
      /** Format: date-time */
      CreatedAt?: string;
      /** Format: int64 */
      TotalSize?: number;
      NumChunks?: number;
    };
    ListBackupsResponse: {
      backups?: components["schemas"]["BackupSummary"][];
    };
    RestoreBackupRequest: {
      /** @description Destination index within the path tenant. The destination directory must be empty -- restore refuses to overwrite existing data. */
      dest_index: string;
    };
    RestoreBackupResponse: {
      /** @enum {string} */
      status?: "restored";
      index_id?: string;
    };
    DeleteBackupResponse: {
      /** @enum {string} */
      status?: "deleted";
    };
  };
  responses: {
    /** @description Bad request. */
    BadRequest: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "bad_request",
         *         "message": "Invalid tenant ID format"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Validation error. */
    ValidationError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "validation_error",
         *         "message": "Tenant name is required"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Resource not found. */
    NotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "not_found",
         *         "message": "Index not found"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Authentication required. */
    Unauthorized: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "unauthorized",
         *         "message": "Authentication required"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Access denied. */
    Forbidden: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "forbidden",
         *         "message": "Index does not belong to this tenant"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Quota exceeded. */
    QuotaExceeded: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "quota_exceeded",
         *         "message": "Queries quota exceeded"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Index is not ready for queries. */
    IndexNotReady: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "index_not_ready",
         *         "message": "Index is not ready for queries"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Internal server error. */
    InternalError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "internal_error",
         *         "message": "an internal error occurred"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /** @description Feature not yet implemented. */
    NotImplemented: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": {
         *         "code": "not_implemented",
         *         "message": "Index updates are not yet persisted"
         *       }
         *     }
         */
        "application/json": components["schemas"]["ErrorEnvelope"];
      };
    };
    /**
     * @description Backups are not enabled on this server. The body is a flat
     *     `{"error": "<message>"}` object -- NOT the standard
     *     `ErrorEnvelope` -- this route bypasses the handler error
     *     helpers.
     */
    BackupDisabled: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "error": "backup not enabled; start the server with --backup-dir"
         *     }
         */
        "application/json": {
          error?: string;
        };
      };
    };
  };
  parameters: {
    /**
     * @description Unique tenant identifier.
     * @example t_acme
     */
    tenantID: string;
    /**
     * @description Unique index identifier within the tenant.
     * @example i_codebase
     */
    indexID: string;
    /**
     * @description Integer document identifier.
     * @example 0
     */
    docID: number;
    /**
     * @description Integer chunk identifier.
     * @example 0
     */
    chunkID: number;
    /**
     * @description Organization identifier.
     * @example org-acme
     */
    orgID: string;
    /**
     * @description User identifier within the org.
     * @example user-42
     */
    userID: string;
    /**
     * @description Backup identifier. Percent-encoded by the client because a
     *     BackupID contains slashes (it embeds the tenant, index and
     *     timestamp).
     * @example backups%2Ft_acme%2Fidx_abc123%2F20260810T120000_000000000Z
     */
    backupID: string;
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  healthCheck: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Server is healthy. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "status": "healthy"
           *     }
           */
          "application/json": components["schemas"]["HealthResponse"];
        };
      };
    };
  };
  readinessCheck: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Server is ready. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "status": "ready"
           *     }
           */
          "application/json": components["schemas"]["ReadyResponse"];
        };
      };
      /** @description Server is not ready. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "status": "not ready",
           *       "reason": "manager not initialized"
           *     }
           */
          "application/json": components["schemas"]["ReadyResponse"];
        };
      };
    };
  };
  getLicenseStatus: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description License status snapshot. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "state": "active",
           *       "license_id": "lic_abc123",
           *       "entitlements": {
           *         "max_tenants": 50,
           *         "max_memory_bytes": 17179869184,
           *         "max_cpu": 8,
           *         "max_disk_bytes": 1099511627776
           *       },
           *       "current_fingerprint": "fp_9c2e1a",
           *       "bound_fingerprint": "fp_9c2e1a",
           *       "fingerprint_match": true
           *     }
           */
          "application/json": components["schemas"]["LicenseStatus"];
        };
      };
    };
  };
  getLicenseAudit: {
    parameters: {
      query?: {
        /**
         * @description Maximum number of events to return. Omitted, zero, negative,
         *     or greater than 1000 are all clamped to 1000.
         */
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /**
       * @description Audit events, newest first. The response body is a bare
       *     JSON array, not wrapped in an object.
       */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LicenseAuditEvent"][];
        };
      };
      /**
       * @description The audit provider failed to read its log. The body is a
       *     flat `{"error": "<message>"}` object -- NOT the standard
       *     `ErrorEnvelope` -- this route bypasses the handler error
       *     helpers and encodes the provider error directly.
       */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "error": "open /data/license/audit.jsonl: permission denied"
           *     }
           */
          "application/json": {
            error?: string;
          };
        };
      };
    };
  };
  listTenants: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Tenant list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ListTenantsResponse"];
        };
      };
      500: components["responses"]["InternalError"];
    };
  };
  createTenant: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "name": "acme-corp"
         *     }
         */
        "application/json": components["schemas"]["CreateTenantRequest"];
      };
    };
    responses: {
      /** @description Tenant created (or already existed when id was supplied). */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TenantResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      500: components["responses"]["InternalError"];
    };
  };
  getTenant: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Tenant found. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TenantDetailResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteTenant: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Tenant deleted. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "deleted": true,
           *       "tenant_id": "t_acme",
           *       "name": "acme-corp"
           *     }
           */
          "application/json": components["schemas"]["DeleteTenantResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  listIndexes: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Index list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ListIndexesResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  createIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateIndexRequest"];
      };
    };
    responses: {
      /** @description Index created. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["IndexInfo"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  getIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Index found. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["IndexInfo"];
        };
      };
      400: components["responses"]["BadRequest"];
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
    };
  };
  deleteIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Index deleted. */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  updateIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UpdateIndexRequest"];
      };
    };
    responses: {
      /** @description Index updated. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["IndexInfo"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  getIndexStatus: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Index status. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "status": "ready",
           *       "error": ""
           *     }
           */
          "application/json": components["schemas"]["IndexStatusResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
    };
  };
  listDocumentsByPrefix: {
    parameters: {
      query?: {
        /** @description External-ID prefix to match. Omitted/empty matches every document. */
        prefix?: string;
        /** @description Opaque pagination cursor from a previous response's `next_cursor`. */
        cursor?: string;
        /** @description Page size. Defaults to 100, capped at 1000. */
        limit?: number;
      };
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Matching documents. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "documents": [
           *         {
           *           "id": "doc-001",
           *           "text": "First document.",
           *           "metadata": {
           *             "source": "readme"
           *           }
           *         }
           *       ],
           *       "next_cursor": ""
           *     }
           */
          "application/json": components["schemas"]["ListDocumentsResponse"];
        };
      };
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  addDocuments: {
    parameters: {
      query?: {
        /** @description Overrides the body's `defer_save` field when present (boolean string, e.g. true/false/1/0). */
        defer_save?: boolean;
        /** @description Overrides the body's `bulk` field when present (boolean string, e.g. true/false/1/0). */
        bulk?: boolean;
      };
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "documents": [
         *         {
         *           "text": "GraphANN is a storage-efficient vector database.",
         *           "metadata": {
         *             "source": "readme"
         *           }
         *         },
         *         {
         *           "content": "GraphANN achieves up to 95%+ storage savings at scale.",
         *           "repo_id": "repo-123"
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["AddDocumentsRequest"];
      };
    };
    responses: {
      /** @description Documents added. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "added": 2,
           *       "index_id": "idx_abc123",
           *       "chunk_ids": [
           *         0,
           *         1
           *       ]
           *     }
           */
          "application/json": components["schemas"]["AddDocumentsResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      429: components["responses"]["QuotaExceeded"];
      500: components["responses"]["InternalError"];
    };
  };
  bulkDeleteDocuments: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "document_ids": [
         *         0,
         *         1,
         *         2
         *       ]
         *     }
         */
        "application/json": components["schemas"]["BulkDeleteDocumentsRequest"];
      };
    };
    responses: {
      /** @description Documents deleted. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "documents_deleted": 3,
           *       "chunks_deleted": 9,
           *       "deleted_per_doc": {
           *         "0": 3,
           *         "1": 3,
           *         "2": 3
           *       }
           *     }
           */
          "application/json": components["schemas"]["BulkDeleteDocumentsResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  bulkDeleteByExternalIDs: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "external_ids": [
         *         "doc-001",
         *         "doc-002"
         *       ]
         *     }
         */
        "application/json": components["schemas"]["BulkDeleteByExternalIDsRequest"];
      };
    };
    responses: {
      /** @description Documents deleted. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "documents_deleted": 2,
           *       "chunks_deleted": 6,
           *       "deleted_per_id": {
           *         "doc-001": 3,
           *         "doc-002": 3
           *       }
           *     }
           */
          "application/json": components["schemas"]["BulkDeleteByExternalIDsResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  upsertResource: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        tenantID: string;
        indexID: string;
        /** @description Stable resource identifier (e.g. a document URL or external primary key). */
        resourceID: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UpsertResourceRequest"];
      };
    };
    responses: {
      /** @description Upsert succeeded */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["UpsertResourceResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthorized"];
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  getDocument: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
        /**
         * @description Integer document identifier.
         * @example 0
         */
        docID: components["parameters"]["docID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Document found. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["GetDocumentResponse"];
        };
      };
      404: components["responses"]["NotFound"];
    };
  };
  deleteDocument: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
        /**
         * @description Integer document identifier.
         * @example 0
         */
        docID: components["parameters"]["docID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Document deleted. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "deleted_chunks": 3,
           *       "document_id": 0,
           *       "index_id": "idx_abc123"
           *     }
           */
          "application/json": components["schemas"]["DeleteDocumentResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  getChunk: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
        /**
         * @description Integer chunk identifier.
         * @example 0
         */
        chunkID: components["parameters"]["chunkID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Chunk found. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "chunk_id": 0,
           *       "text": "GraphANN is a storage-efficient vector database.",
           *       "document_id": 0,
           *       "chunk_index": 0,
           *       "start": 0,
           *       "end": 49
           *     }
           */
          "application/json": components["schemas"]["ChunkResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
    };
  };
  deleteChunk: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
        /**
         * @description Integer chunk identifier.
         * @example 0
         */
        chunkID: components["parameters"]["chunkID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "chunk_ids": [
         *         0,
         *         1
         *       ]
         *     }
         */
        "application/json": components["schemas"]["DeleteChunksRequest"];
      };
    };
    responses: {
      /** @description Chunks deleted. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "deleted": 2,
           *       "index_id": "idx_abc123"
           *     }
           */
          "application/json": components["schemas"]["DeleteChunksResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  search: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "query": "storage efficient vector database",
         *       "k": 5
         *     }
         */
        "application/json": components["schemas"]["SearchRequest"];
      };
    };
    responses: {
      /** @description Search results. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SearchResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      429: components["responses"]["QuotaExceeded"];
      503: components["responses"]["IndexNotReady"];
    };
  };
  batchSearch: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "queries": [
         *         {
         *           "query": "storage efficient vector database",
         *           "k": 5
         *         },
         *         {
         *           "query": "hybrid search fusion",
         *           "k": 5,
         *           "hybrid": true
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["BatchSearchRequest"];
      };
    };
    responses: {
      /** @description One result (or error) per query, in request order. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["BatchSearchResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      503: components["responses"]["IndexNotReady"];
    };
  };
  compactIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Compaction completed. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "status": "compacted",
           *       "message": "Index compaction completed"
           *     }
           */
          "application/json": components["schemas"]["CompactResponse"];
        };
      };
      404: components["responses"]["NotFound"];
      /**
       * @description Compaction is already in progress for this index. Either the
       *     previous HTTP-triggered run hasn't finished, or auto-compaction
       *     is mid-flight. Wait for the in-flight job to complete (poll
       *     `graphann_compaction_in_progress{index_id}` Prometheus gauge)
       *     and retry.
       */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "error": {
           *         "code": "COMPACT_ALREADY_IN_PROGRESS",
           *         "message": "compaction already in progress for this index"
           *       }
           *     }
           */
          "application/json": components["schemas"]["ErrorEnvelope"];
        };
      };
      500: components["responses"]["InternalError"];
    };
  };
  compactAllIndexes: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Compaction queued. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "tenant_id": "t_acme",
           *       "total_indexes": 3,
           *       "queued": [
           *         "idx_a",
           *         "idx_b"
           *       ],
           *       "queued_count": 2,
           *       "skipped": [
           *         {
           *           "index_id": "idx_c",
           *           "reason": "already queued or in flight"
           *         }
           *       ],
           *       "skipped_count": 1,
           *       "message": "Compaction queued; indexes are compacted one at a time. Track progress via GET /v1/jobs."
           *     }
           */
          "application/json": components["schemas"]["CompactAllResponse"];
        };
      };
      403: components["responses"]["Forbidden"];
      /** @description The server has no compaction scheduler wired; bulk compaction is unavailable. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "error": {
           *         "code": "conflict",
           *         "message": "bulk compaction requires the compaction scheduler; this server was started without it"
           *       }
           *     }
           */
          "application/json": components["schemas"]["ErrorEnvelope"];
        };
      };
      500: components["responses"]["InternalError"];
    };
  };
  clearIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Index cleared. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "status": "cleared",
           *       "message": "Index data cleared successfully"
           *     }
           */
          "application/json": components["schemas"]["ClearResponse"];
        };
      };
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  getLiveIndexStats: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Index statistics. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LiveStatsResponse"];
        };
      };
      404: components["responses"]["NotFound"];
    };
  };
  flushIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Delta flushed. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "flushed": true
           *     }
           */
          "application/json": components["schemas"]["FlushIndexResponse"];
        };
      };
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  rebuildIndexGraph: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Graph rebuilt. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "rebuilt": true,
           *       "chunks": 1024,
           *       "wall_ms": 842
           *     }
           */
          "application/json": components["schemas"]["RebuildGraphResponse"];
        };
      };
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      /** @description A compaction is in progress on this index; retry after it completes. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "error": {
           *         "code": "conflict",
           *         "message": "graph rebuild refused: compaction in progress, retry after it completes"
           *       }
           *     }
           */
          "application/json": components["schemas"]["ErrorEnvelope"];
        };
      };
      500: components["responses"]["InternalError"];
    };
  };
  importDocuments: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "documents": [
         *         {
         *           "id": "doc-001",
         *           "text": "First document to import."
         *         },
         *         {
         *           "id": "doc-002",
         *           "text": "Second document to import."
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["ImportDocumentsRequest"];
      };
    };
    responses: {
      /** @description Documents queued for processing. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "imported": 2,
           *       "document_ids": [
           *         0,
           *         1
           *       ],
           *       "index_id": "idx_abc123",
           *       "pending_total": 2,
           *       "status": "processing",
           *       "message": "Documents queued. Processing and compaction will happen automatically."
           *     }
           */
          "application/json": components["schemas"]["ImportDocumentsResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  getPendingStatus: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Pending status. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "pending_count": 5
           *     }
           */
          "application/json": components["schemas"]["PendingStatusResponse"];
        };
      };
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  clearPending: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Pending queue cleared. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "status": "cleared",
           *       "message": "Pending documents cleared"
           *     }
           */
          "application/json": components["schemas"]["ClearPendingResponse"];
        };
      };
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  processPending: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Processing completed. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "processed": 5,
           *       "chunks_created": 12,
           *       "chunk_ids": [
           *         0,
           *         1,
           *         2,
           *         3,
           *         4,
           *         5,
           *         6,
           *         7,
           *         8,
           *         9,
           *         10,
           *         11
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ProcessPendingResponse"];
        };
      };
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  syncDocuments: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Organization identifier.
         * @example org-acme
         */
        orgID: components["parameters"]["orgID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "user_id": "user-42",
         *       "source_type": "github",
         *       "shared": true,
         *       "documents": [
         *         {
         *           "resource_id": "github:repo/file.go",
         *           "text": "package main ...",
         *           "metadata": {
         *             "repo_id": "repo-123",
         *             "file_path": "main.go",
         *             "commit_sha": "abc123"
         *           }
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["SyncDocumentsRequest"];
      };
    };
    responses: {
      /** @description Documents synced. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "synced": 1,
           *       "org_id": "org-acme",
           *       "user_id": "user-42",
           *       "source_type": "github",
           *       "index_type": "shared"
           *     }
           */
          "application/json": components["schemas"]["SyncDocumentsResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      500: components["responses"]["InternalError"];
    };
  };
  searchMultiIndex: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Organization identifier.
         * @example org-acme
         */
        orgID: components["parameters"]["orgID"];
        /**
         * @description User identifier within the org.
         * @example user-42
         */
        userID: components["parameters"]["userID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "query": "what happened today?",
         *       "include_text": true,
         *       "sources": [
         *         "github",
         *         "slack"
         *       ],
         *       "start_time": 1711670400
         *     }
         */
        "application/json": components["schemas"]["MultiSearchRequest"];
      };
    };
    responses: {
      /** @description Search results from multiple indexes. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["MultiSearchResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      500: components["responses"]["InternalError"];
    };
  };
  listUserIndexes: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Organization identifier.
         * @example org-acme
         */
        orgID: components["parameters"]["orgID"];
        /**
         * @description User identifier within the org.
         * @example user-42
         */
        userID: components["parameters"]["userID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User index list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["OrgIndexListResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      500: components["responses"]["InternalError"];
    };
  };
  listSharedIndexes: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Organization identifier.
         * @example org-acme
         */
        orgID: components["parameters"]["orgID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Shared index list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SharedIndexListResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      500: components["responses"]["InternalError"];
    };
  };
  switchEmbeddingModel: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "embedding_backend": "openai",
         *       "model": "text-embedding-3-small",
         *       "dimension": 1536,
         *       "api_key": "sk-..."
         *     }
         */
        "application/json": components["schemas"]["SwitchEmbeddingModelRequest"];
      };
    };
    responses: {
      /** @description Job accepted and queued. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "job_id": "job_d3f3...-...",
           *       "status": "queued"
           *     }
           */
          "application/json": components["schemas"]["SwitchEmbeddingModelResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      /** @description A reembed job is already in flight for this index. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "error": {
           *         "code": "conflict",
           *         "message": "a reembed job is already in flight for this index",
           *         "details": {
           *           "job_id": "job_abcd...",
           *           "status": "running"
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["ErrorEnvelope"];
        };
      };
      /** @description Job queue is full. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ErrorEnvelope"];
        };
      };
    };
  };
  listAllJobs: {
    parameters: {
      query?: {
        /** @description Filter to one job status. */
        status?: "queued" | "running" | "completed" | "failed";
        /** @description Opaque cursor returned in `next_cursor` of a previous page. */
        cursor?: string;
        /** @description Max jobs per page (default 50, hard cap 200). */
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Job list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["JobListResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      403: components["responses"]["Forbidden"];
      500: components["responses"]["InternalError"];
    };
  };
  getJob: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Job identifier returned by an earlier PATCH.
         * @example job_8b1c...-...
         */
        jobID: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Job found. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["Job"];
        };
      };
      400: components["responses"]["BadRequest"];
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  listTenantJobs: {
    parameters: {
      query?: {
        status?: "queued" | "running" | "completed" | "failed";
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Job list scoped to tenant. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["JobListResponse"];
        };
      };
      400: components["responses"]["ValidationError"];
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  runIndexGC: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description TTL sweep completed. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "index_id": "idx_abc123",
           *       "expired": 17,
           *       "status": "ok"
           *     }
           */
          "application/json": components["schemas"]["GCResponse"];
        };
      };
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  runGlobalGC: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Aggregate TTL sweep result. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "indexes_swept": 12,
           *       "expired": 134,
           *       "status": "ok"
           *     }
           */
          "application/json": components["schemas"]["AdminGCResponse"];
        };
      };
      500: components["responses"]["InternalError"];
    };
  };
  cleanupOrphans: {
    parameters: {
      query?: {
        /**
         * @description Minimum age a compaction-tmp directory must have before it is
         *     eligible for removal, as a Go duration string. Defaults to 1h.
         *     The server rejects values below 5m, because a shorter cutoff can
         *     race an in-flight compaction and delete a directory still in use.
         */
        min_age?: string;
        /**
         * @description When true, report what would be removed without deleting anything.
         *     The response echoes this flag and `removed` lists the candidates.
         */
        dry_run?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Orphan cleanup result. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "removed": [
           *         "data/t_acme/i_abc/compaction-tmp-1714000000"
           *       ],
           *       "freed_bytes": 4096,
           *       "status": "ok"
           *     }
           */
          "application/json": components["schemas"]["AdminCleanupResponse"];
        };
      };
      500: components["responses"]["InternalError"];
    };
  };
  getEmbedSpaceAdmin: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Fleet embedding-space snapshot. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "server_model": "bge-small-en-v1.5",
           *       "server_dimension": 384,
           *       "server_embed_fingerprint": "fp_a1b2c3",
           *       "policy": "warn",
           *       "counts": {
           *         "unknown": 0,
           *         "verified": 40,
           *         "mismatch": 0,
           *         "external_unverified": 2,
           *         "external_agree": 1,
           *         "external_diverged": 0
           *       },
           *       "indexes": [
           *         {
           *           "index_id": "idx_abc123",
           *           "tenant_id": "t_acme",
           *           "loaded": true,
           *           "state": "verified",
           *           "embed_fingerprint": "fp_a1b2c3",
           *           "detail": "",
           *           "checked_at": "2026-08-10T12:00:00Z"
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["EmbedSpaceAdminResponse"];
        };
      };
      403: components["responses"]["Forbidden"];
    };
  };
  listClusterNodes: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Cluster member list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "nodes": [
           *         {
           *           "id": "node1",
           *           "addr": "10.0.0.1:50051",
           *           "zone": "us-east-1a",
           *           "state": "alive",
           *           "last_seen": "2026-04-24T12:30:00Z"
           *         }
           *       ],
           *       "leader": "node1"
           *     }
           */
          "application/json": components["schemas"]["ListClusterNodesResponse"];
        };
      };
      403: components["responses"]["Forbidden"];
      500: components["responses"]["InternalError"];
    };
  };
  listClusterShards: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Shard placement. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "shards": [
           *         {
           *           "id": "shard-0",
           *           "primary": "node1",
           *           "replicas": [
           *             "node1",
           *             "node2",
           *             "node3"
           *           ],
           *           "zone_placement": {
           *             "us-east-1a": "node1",
           *             "us-east-1b": "node2",
           *             "us-east-1c": "node3"
           *           }
           *         }
           *       ],
           *       "rf": 3
           *     }
           */
          "application/json": components["schemas"]["ListClusterShardsResponse"];
        };
      };
      403: components["responses"]["Forbidden"];
      500: components["responses"]["InternalError"];
    };
  };
  clusterHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Cluster healthy or degraded. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "status": "ok",
           *       "cluster_size": 3,
           *       "alive_nodes": 3,
           *       "raft_has_leader": true,
           *       "under_replicated_shards": 0
           *     }
           */
          "application/json": components["schemas"]["ClusterHealthResponse"];
        };
      };
      /** @description Cluster is unhealthy. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ClusterHealthResponse"];
        };
      };
    };
  };
  createBackup: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Unique index identifier within the tenant.
         * @example i_codebase
         */
        indexID: components["parameters"]["indexID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Backup created. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "backup_id": "backups/t_acme/idx_abc123/20260810T120000_000000000Z",
           *       "manifest": {
           *         "version": 1,
           *         "id": "backups/t_acme/idx_abc123/20260810T120000_000000000Z",
           *         "created_at": "2026-08-10T12:00:00Z",
           *         "meta": {
           *           "tenant_id": "t_acme",
           *           "index_id": "idx_abc123",
           *           "graphann_version": "1.0.0"
           *         },
           *         "chunks": [
           *           {
           *             "key": "base/index.bin",
           *             "size": 4096,
           *             "sha256": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a5"
           *           }
           *         ],
           *         "total_size": 4096
           *       }
           *     }
           */
          "application/json": components["schemas"]["CreateBackupResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
      501: components["responses"]["BackupDisabled"];
    };
  };
  listBackups: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Backup list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "backups": [
           *         {
           *           "ID": "backups/t_acme/idx_abc123/20260810T120000_000000000Z",
           *           "TenantID": "t_acme",
           *           "IndexID": "idx_abc123",
           *           "CreatedAt": "2026-08-10T12:00:00Z",
           *           "TotalSize": 4096,
           *           "NumChunks": 1
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ListBackupsResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      500: components["responses"]["InternalError"];
      501: components["responses"]["BackupDisabled"];
    };
  };
  restoreBackup: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Backup identifier. Percent-encoded by the client because a
         *     BackupID contains slashes (it embeds the tenant, index and
         *     timestamp).
         * @example backups%2Ft_acme%2Fidx_abc123%2F20260810T120000_000000000Z
         */
        backupID: components["parameters"]["backupID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "dest_index": "idx_restored"
         *     }
         */
        "application/json": components["schemas"]["RestoreBackupRequest"];
      };
    };
    responses: {
      /** @description Backup restored. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "status": "restored",
           *       "index_id": "idx_restored"
           *     }
           */
          "application/json": components["schemas"]["RestoreBackupResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
      501: components["responses"]["BackupDisabled"];
    };
  };
  deleteBackup: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description Backup identifier. Percent-encoded by the client because a
         *     BackupID contains slashes (it embeds the tenant, index and
         *     timestamp).
         * @example backups%2Ft_acme%2Fidx_abc123%2F20260810T120000_000000000Z
         */
        backupID: components["parameters"]["backupID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Backup deleted. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "status": "deleted"
           *     }
           */
          "application/json": components["schemas"]["DeleteBackupResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
      501: components["responses"]["BackupDisabled"];
    };
  };
  listAPIKeys: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description API key list. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ListAPIKeysResponse"];
        };
      };
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  createAPIKey: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "user_id": "u_admin",
         *       "name": "deploy-bot"
         *     }
         */
        "application/json": components["schemas"]["CreateAPIKeyRequest"];
      };
    };
    responses: {
      /** @description API key created. Plaintext is in the response. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["CreateAPIKeyResponse"];
        };
      };
      400: components["responses"]["BadRequest"];
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  revokeAPIKey: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Unique tenant identifier.
         * @example t_acme
         */
        tenantID: components["parameters"]["tenantID"];
        /**
         * @description API key identifier (e.g. `k_abc123`).
         * @example k_abc123
         */
        keyID: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Key revoked. */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      403: components["responses"]["Forbidden"];
      404: components["responses"]["NotFound"];
      500: components["responses"]["InternalError"];
    };
  };
  getLLMSettings: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Organization identifier.
         * @example org-acme
         */
        orgID: components["parameters"]["orgID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description LLM settings. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LLMSettings"];
        };
      };
      400: components["responses"]["BadRequest"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteLLMSettings: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Organization identifier.
         * @example org-acme
         */
        orgID: components["parameters"]["orgID"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Settings reset. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LLMSettings"];
        };
      };
      400: components["responses"]["BadRequest"];
      403: components["responses"]["Forbidden"];
      500: components["responses"]["InternalError"];
    };
  };
  updateLLMSettings: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description Organization identifier.
         * @example org-acme
         */
        orgID: components["parameters"]["orgID"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "model": "gpt-4o-mini",
         *       "temperature": 0.2
         *     }
         */
        "application/json": components["schemas"]["LLMSettingsPatch"];
      };
    };
    responses: {
      /** @description Settings persisted. Response is masked. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LLMSettings"];
        };
      };
      400: components["responses"]["BadRequest"];
      403: components["responses"]["Forbidden"];
      500: components["responses"]["InternalError"];
    };
  };
}
