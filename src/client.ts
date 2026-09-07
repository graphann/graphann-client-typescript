/**
 * `Client` — the main entry point of the SDK.
 *
 * Mirrors the GraphANN HTTP API one method per route. Methods accept typed
 * request objects and an optional `RequestOptions` for cancellation, tenant
 * override, and per-call cache/singleflight bypass.
 */

import { LRUCache } from "./cache.js";
import { GraphANNError } from "./errors.js";
import { request, type HTTPRequest } from "./http.js";
import { type ClientOptions, resolveOptions, type ResolvedClientOptions } from "./options.js";
import { Paginator } from "./pagination.js";
import { SingleFlight, stableHash } from "./singleflight.js";
import type {
  AddDocumentsRequest,
  AddDocumentsResponse,
  APIKey,
  BatchSearchRequest,
  BatchSearchResponse,
  BulkDeleteByExternalIdsResponse,
  BulkDeleteDocumentsResponse,
  ChunkResponse,
  ClearIndexResponse,
  ClearPendingResponse,
  ClusterHealthResponse,
  ClusterNodesResponse,
  ClusterShardsResponse,
  CompactAllResponse,
  CompactIndexResponse,
  CleanupOrphansResponse,
  CreateAPIKeyRequest,
  CreateBackupResponse,
  DeleteBackupResponse,
  EmbedSpaceAdminResponse,
  GCResponse,
  CreateIndexRequest,
  CreateTenantRequest,
  DeleteChunksResponse,
  DeleteDocumentResponse,
  DeleteLLMSettingsResponse,
  DeleteTenantResponse,
  Document,
  FlushIndexResponse,
  GetDocumentResponse,
  HealthResponse,
  IndexID,
  IndexInfo,
  IndexStatusResponse,
  ImportDocumentsResponse,
  Job,
  LicenseAuditEvent,
  LicenseStatus,
  ListAPIKeysResponse,
  ListBackupsResponse,
  ListDocumentEntry,
  ListDocumentsOptions,
  ListDocumentsPage,
  ListIndexesResponse,
  ListJobsOptions,
  ListJobsResponse,
  ListTenantsResponse,
  LiveIndexStats,
  LLMSettings,
  MultiSearchRequest,
  MultiSearchResponse,
  OrgIndexListResponse,
  OrgSyncDocumentsRequest,
  OrgSyncDocumentsResponse,
  Page,
  PendingStatusResponse,
  ProcessPendingResponse,
  RebuildGraphResponse,
  RequestOptions,
  RestoreBackupResponse,
  SearchRequest,
  SearchResponse,
  SwitchEmbeddingModelRequest,
  SwitchEmbeddingModelResponse,
  Tenant,
  TenantID,
  UpdateIndexRequest,
  UpdateLLMSettingsResponse,
  UpsertResourceRequest,
  UpsertResourceResponse,
} from "./types.js";

export class Client {
  private readonly opts: ResolvedClientOptions;
  private readonly singleflight: SingleFlight<unknown>;
  private readonly cache: LRUCache<string, unknown> | null;
  private generation = 0;

  constructor(options: ClientOptions) {
    this.opts = resolveOptions(options);
    this.singleflight = new SingleFlight<unknown>();
    this.cache = this.opts.cache
      ? new LRUCache<string, unknown>(this.opts.cacheSize, this.opts.cacheTTL)
      : null;
  }

  // -------------------------------------------------------------------------
  // Health
  // -------------------------------------------------------------------------

  /** GET /health */
  async health(opts: RequestOptions = {}): Promise<HealthResponse> {
    return this.send<HealthResponse>(
      { method: "GET", path: "/health", signal: opts.signal },
      { ...opts, idempotent: true },
    );
  }

  /**
   * GET /ready
   *
   * Server returns `{ status: "ready" }` on success and a 503 with an
   * explanatory `reason` payload while the manager is still warming up.
   * Non-2xx is mapped to the matching `GraphANNError` subclass like every
   * other call. Bodyless 200 responses (some proxies strip JSON) parse to
   * `{}` — the runtime body is whatever the server actually sent.
   */
  async ready(opts: RequestOptions = {}): Promise<HealthResponse> {
    return this.send<HealthResponse>(
      { method: "GET", path: "/ready", signal: opts.signal },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Tenants
  // -------------------------------------------------------------------------

  /** GET /v1/tenants */
  async listTenants(opts: RequestOptions = {}): Promise<ListTenantsResponse> {
    return this.send<ListTenantsResponse>(
      { method: "GET", path: "/v1/tenants" },
      { ...opts, idempotent: true },
    );
  }

  /** POST /v1/tenants */
  async createTenant(req: CreateTenantRequest, opts: RequestOptions = {}): Promise<Tenant> {
    return this.send<Tenant>({ method: "POST", path: "/v1/tenants", body: req }, opts);
  }

  /** GET /v1/tenants/{id} */
  async getTenant(tenantId: TenantID, opts: RequestOptions = {}): Promise<Tenant> {
    return this.send<Tenant>(
      { method: "GET", path: `/v1/tenants/${encodeURIComponent(tenantId)}` },
      { ...opts, idempotent: true },
    );
  }

  /** DELETE /v1/tenants/{id} */
  async deleteTenant(tenantId: TenantID, opts: RequestOptions = {}): Promise<DeleteTenantResponse> {
    return this.send<DeleteTenantResponse>(
      { method: "DELETE", path: `/v1/tenants/${encodeURIComponent(tenantId)}` },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // Indexes
  // -------------------------------------------------------------------------

  /** GET /v1/tenants/{tid}/indexes */
  async listIndexes(opts: RequestOptions = {}): Promise<ListIndexesResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ListIndexesResponse>(
      { method: "GET", path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes` },
      { ...opts, idempotent: true },
    );
  }

  /** POST /v1/tenants/{tid}/indexes */
  async createIndex(req: CreateIndexRequest, opts: RequestOptions = {}): Promise<IndexInfo> {
    const tenantId = this.requireTenant(opts);
    return this.send<IndexInfo>(
      { method: "POST", path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes`, body: req },
      opts,
    );
  }

  /** GET /v1/tenants/{tid}/indexes/{iid} */
  async getIndex(indexId: IndexID, opts: RequestOptions = {}): Promise<IndexInfo> {
    const tenantId = this.requireTenant(opts);
    return this.send<IndexInfo>(
      {
        method: "GET",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}`,
      },
      { ...opts, idempotent: true },
    );
  }

  /** DELETE /v1/tenants/{tid}/indexes/{iid} */
  async deleteIndex(indexId: IndexID, opts: RequestOptions = {}): Promise<void> {
    const tenantId = this.requireTenant(opts);
    await this.send<void>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}`,
      },
      opts,
    );
  }

  /** PATCH /v1/tenants/{tid}/indexes/{iid} */
  async updateIndex(
    indexId: IndexID,
    req: UpdateIndexRequest,
    opts: RequestOptions = {},
  ): Promise<IndexInfo> {
    const tenantId = this.requireTenant(opts);
    return this.send<IndexInfo>(
      {
        method: "PATCH",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}`,
        body: req,
      },
      opts,
    );
  }

  /** GET /v1/tenants/{tid}/indexes/{iid}/status */
  async getIndexStatus(indexId: IndexID, opts: RequestOptions = {}): Promise<IndexStatusResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<IndexStatusResponse>(
      {
        method: "GET",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/status`,
      },
      { ...opts, idempotent: true },
    );
  }

  /**
   * POST /v1/tenants/{tid}/indexes/{iid}/compact
   *
   * Returns `200 OK` with `status: "compacting"` — compaction runs
   * asynchronously; this endpoint provides no poll, observe completion
   * via live-stats/logs. Throws `ConflictError` (HTTP 409) when a
   * compaction is already running. Callers should catch and retry after
   * a back-off. (The transport sends `{}` with
   * `Content-Type: application/json` — the server's middleware requires
   * the header on every mutating verb, body-less POSTs included.)
   */
  async compactIndex(indexId: IndexID, opts: RequestOptions = {}): Promise<CompactIndexResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<CompactIndexResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/compact`,
      },
      opts,
    );
  }

  /** POST /v1/tenants/{tid}/indexes/{iid}/clear */
  async clearIndex(indexId: IndexID, opts: RequestOptions = {}): Promise<ClearIndexResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ClearIndexResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/clear`,
      },
      opts,
    );
  }

  /**
   * POST /v1/tenants/{tid}/indexes/{iid}/flush
   *
   * Persists the live index's in-memory delta. Any pending bulk-deferred
   * HNSW graph (see `AddDocumentsRequest.bulk`) is built once —
   * concurrently — inside the flush and persisted with it. Pairs with
   * `defer_save`/`bulk` ingest; safe to call on a clean index.
   */
  async flushIndex(indexId: IndexID, opts: RequestOptions = {}): Promise<FlushIndexResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<FlushIndexResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/flush`,
      },
      opts,
    );
  }

  /**
   * POST /v1/tenants/{tid}/indexes/{iid}/rebuild-graph
   *
   * In-place delta-HNSW rebuild — migration endpoint for indexes
   * ingested before the 2026-06 neighbor-selection fix (fragmented
   * graphs). Throws `ConflictError` (HTTP 409) while a compaction is in
   * progress.
   */
  async rebuildGraph(indexId: IndexID, opts: RequestOptions = {}): Promise<RebuildGraphResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<RebuildGraphResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/rebuild-graph`,
      },
      opts,
    );
  }

  /** GET /v1/tenants/{tid}/indexes/{iid}/live-stats */
  async getLiveStats(indexId: IndexID, opts: RequestOptions = {}): Promise<LiveIndexStats> {
    const tenantId = this.requireTenant(opts);
    return this.send<LiveIndexStats>(
      {
        method: "GET",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/live-stats`,
      },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Chunks
  // -------------------------------------------------------------------------

  /** GET /v1/tenants/{tid}/indexes/{iid}/chunks/{chunkID} */
  async getChunk(
    indexId: IndexID,
    chunkId: number | string,
    opts: RequestOptions = {},
  ): Promise<ChunkResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ChunkResponse>(
      {
        method: "GET",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/chunks/${encodeURIComponent(String(chunkId))}`,
      },
      { ...opts, idempotent: true },
    );
  }

  /**
   * DELETE /v1/tenants/{tid}/indexes/{iid}/chunks/{chunkID}
   *
   * Server-side this route accepts a `{chunk_ids: [...]}` body and ignores
   * the path-segment chunk ID — it is a per-call placeholder, so the SDK
   * sends `/0` as a sentinel (matches the Go SDK's `DeleteChunks`).
   * Callers pass the full list of chunk IDs to delete.
   */
  async deleteChunks(
    indexId: IndexID,
    chunkIds: number[],
    opts: RequestOptions = {},
  ): Promise<DeleteChunksResponse> {
    const tenantId = this.requireTenant(opts);
    if (!Array.isArray(chunkIds) || chunkIds.length === 0) {
      throw new GraphANNError("deleteChunks: chunkIds must be a non-empty number[]");
    }
    for (const id of chunkIds) {
      if (typeof id !== "number" || !Number.isFinite(id)) {
        throw new GraphANNError(`deleteChunks: chunkIds must be finite numbers, got ${String(id)}`);
      }
    }
    return this.send<DeleteChunksResponse>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/chunks/0`,
        body: { chunk_ids: chunkIds },
      },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // Pending queue (batch import)
  // -------------------------------------------------------------------------

  /** GET /v1/tenants/{tid}/indexes/{iid}/pending */
  async getPendingStatus(
    indexId: IndexID,
    opts: RequestOptions = {},
  ): Promise<PendingStatusResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<PendingStatusResponse>(
      {
        method: "GET",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/pending`,
      },
      { ...opts, idempotent: true },
    );
  }

  /** POST /v1/tenants/{tid}/indexes/{iid}/process */
  async processPending(
    indexId: IndexID,
    opts: RequestOptions = {},
  ): Promise<ProcessPendingResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ProcessPendingResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/process`,
      },
      opts,
    );
  }

  /** DELETE /v1/tenants/{tid}/indexes/{iid}/pending */
  async clearPending(indexId: IndexID, opts: RequestOptions = {}): Promise<ClearPendingResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ClearPendingResponse>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/pending`,
      },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------

  /**
   * POST /v1/tenants/{tid}/indexes/{iid}/documents
   *
   * Accepts either a plain `Document[]` (unchanged behavior) or a full
   * `AddDocumentsRequest` to set the `defer_save` / `bulk` ingest
   * options. Per-document `vector` enables precomputed-vector ingest —
   * all-or-nothing per batch (see `Document.vector`). Request bodies are
   * capped at 16 MB server-side (throws `PayloadTooLargeError`), which
   * caps precomputed batches at roughly 1700 documents.
   */
  async addDocuments(
    indexId: IndexID,
    documents: Document[] | AddDocumentsRequest,
    opts: RequestOptions = {},
  ): Promise<AddDocumentsResponse> {
    const tenantId = this.requireTenant(opts);
    const req: AddDocumentsRequest = Array.isArray(documents) ? { documents } : documents;
    const body: Record<string, unknown> = { documents: req.documents };
    if (req.defer_save !== undefined) body.defer_save = req.defer_save;
    if (req.bulk !== undefined) body.bulk = req.bulk;
    return this.send<AddDocumentsResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/documents`,
        body,
      },
      opts,
    );
  }

  /** POST /v1/tenants/{tid}/indexes/{iid}/import */
  async importDocuments(
    indexId: IndexID,
    documents: Document[],
    opts: RequestOptions = {},
  ): Promise<ImportDocumentsResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ImportDocumentsResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/import`,
        body: { documents },
      },
      opts,
    );
  }

  /**
   * Async iterator over /v1/tenants/{tid}/indexes/{iid}/documents.
   * Yields one `{ items, nextCursor }` per server page.
   */
  listDocuments(
    args: ListDocumentsOptions,
    opts: RequestOptions = {},
  ): Paginator<ListDocumentEntry> {
    const tenantId = args.tenantId ?? this.requireTenant(opts);
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(args.indexId)}/documents`;
    const fetcher = async (
      cursor: string | undefined,
      signal?: AbortSignal,
    ): Promise<Page<ListDocumentEntry>> => {
      const query: Record<string, string | number | undefined> = {};
      if (args.prefix !== undefined) query.prefix = args.prefix;
      if (args.limit !== undefined) query.limit = args.limit;
      if (cursor !== undefined) query.cursor = cursor;
      const resp = await this.send<ListDocumentsPage>(
        { method: "GET", path, query, signal: signal ?? opts.signal },
        { ...opts, idempotent: true },
      );
      return {
        items: resp.documents ?? [],
        nextCursor:
          typeof resp.next_cursor === "string" && resp.next_cursor.length > 0
            ? resp.next_cursor
            : null,
      };
    };
    return new Paginator(fetcher, opts.signal);
  }

  /** GET /v1/tenants/{tid}/indexes/{iid}/documents/{docID} */
  async getDocument(
    indexId: IndexID,
    documentId: number | string,
    opts: RequestOptions = {},
  ): Promise<GetDocumentResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<GetDocumentResponse>(
      {
        method: "GET",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/documents/${encodeURIComponent(String(documentId))}`,
      },
      { ...opts, idempotent: true },
    );
  }

  /** DELETE /v1/tenants/{tid}/indexes/{iid}/documents/{docID} */
  async deleteDocument(
    indexId: IndexID,
    documentId: number | string,
    opts: RequestOptions = {},
  ): Promise<DeleteDocumentResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<DeleteDocumentResponse>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/documents/${encodeURIComponent(String(documentId))}`,
      },
      opts,
    );
  }

  /** DELETE /v1/tenants/{tid}/indexes/{iid}/documents (bulk) */
  async bulkDeleteDocuments(
    indexId: IndexID,
    documentIds: number[],
    opts: RequestOptions = {},
  ): Promise<BulkDeleteDocumentsResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<BulkDeleteDocumentsResponse>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/documents`,
        body: { document_ids: documentIds },
      },
      opts,
    );
  }

  /** DELETE /v1/tenants/{tid}/indexes/{iid}/documents/by-external-id (bulk) */
  async bulkDeleteByExternalIds(
    indexId: IndexID,
    externalIds: string[],
    opts: RequestOptions = {},
  ): Promise<BulkDeleteByExternalIdsResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<BulkDeleteByExternalIdsResponse>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/documents/by-external-id`,
        body: { external_ids: externalIds },
      },
      opts,
    );
  }

  /**
   * `POST /v1/admin/cleanup-orphans` — admin-only.
   *
   * Sweeps stale compaction artifacts (`*.old` / `*.compact` / `*.backup`
   * / `*.failed`) and pre-reembed snapshots
   * (`*.pre-reembed.<timestamp>`) from every tenant's data tree.
   *
   * @param minAge Go-style duration string controlling the minimum age
   *   before an artifact is eligible for removal (e.g. `"1h"`, `"24h"`,
   *   `"30m"`). Empty string `""` uses the server default (1h). The
   *   server enforces a 5-minute floor — passing a smaller positive
   *   value yields HTTP 400.
   * @param dryRun When `true`, the server enumerates what *would* have
   *   been removed without touching disk.
   */
  async cleanupOrphans(
    minAge: string = "",
    dryRun: boolean = false,
    opts: RequestOptions = {},
  ): Promise<CleanupOrphansResponse> {
    const query: Record<string, string> = {};
    if (minAge) {
      query.min_age = minAge;
    }
    if (dryRun) {
      query.dry_run = "true";
    }
    return this.send<CleanupOrphansResponse>(
      {
        method: "POST",
        path: "/v1/admin/cleanup-orphans",
        ...(Object.keys(query).length > 0 ? { query } : {}),
      },
      opts,
    );
  }

  /**
   * POST /v1/tenants/{tenantId}/indexes/{indexId}/gc — sweep expired
   * documents for one index. Idempotent (returns 0 the second time).
   */
  async runIndexGC(
    tenantId: string,
    indexId: string,
    opts: RequestOptions = {},
  ): Promise<GCResponse> {
    return this.send<GCResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/gc`,
      },
      opts,
    );
  }

  /** POST /v1/admin/gc — sweep expired documents across every loaded index. */
  async runAdminGC(opts: RequestOptions = {}): Promise<GCResponse> {
    return this.send<GCResponse>({ method: "POST", path: "/v1/admin/gc" }, opts);
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  /** POST /v1/tenants/{tid}/indexes/{iid}/search (hybrid) */
  async search(req: SearchRequest, opts: RequestOptions = {}): Promise<SearchResponse> {
    const tenantId = req.tenantId ?? this.requireTenant(opts);
    if (!req.query && (!req.vector || req.vector.length === 0) && !req.vector_b64) {
      throw new GraphANNError("search() requires `query`, `vector`, or `vector_b64`");
    }
    const body: Record<string, unknown> = {};
    if (req.query !== undefined) body.query = req.query;
    if (req.vector !== undefined) body.vector = req.vector;
    if (req.vector_b64 !== undefined) body.vector_b64 = req.vector_b64;
    if (req.k !== undefined) body.k = req.k;
    if (req.filter !== undefined) body.filter = req.filter;
    if (req.rerank !== undefined) body.rerank = req.rerank;
    if (req.candidate_k !== undefined) body.candidate_k = req.candidate_k;
    if (req.rerank_k !== undefined) body.rerank_k = req.rerank_k;
    if (req.ef_search !== undefined) body.ef_search = req.ef_search;
    if (req.hybrid !== undefined) body.hybrid = req.hybrid;
    return this.send<SearchResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(req.indexId)}/search`,
        body,
      },
      { ...opts, idempotent: true },
    );
  }

  /** POST /v1/orgs/{orgID}/users/{userID}/search */
  async multiSearch(
    req: MultiSearchRequest,
    opts: RequestOptions = {},
  ): Promise<MultiSearchResponse> {
    const body: Record<string, unknown> = { query: req.query };
    if (req.k !== undefined) body.k = req.k;
    if (req.sources !== undefined) body.sources = req.sources;
    if (req.ef_search !== undefined) body.ef_search = req.ef_search;
    if (req.include_text !== undefined) body.include_text = req.include_text;
    if (req.start_time !== undefined) body.start_time = req.start_time;
    if (req.end_time !== undefined) body.end_time = req.end_time;
    if (req.distance_threshold !== undefined) body.distance_threshold = req.distance_threshold;
    return this.send<MultiSearchResponse>(
      {
        method: "POST",
        path: `/v1/orgs/${encodeURIComponent(req.orgId)}/users/${encodeURIComponent(req.userId)}/search`,
        body,
      },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Org-level sync
  // -------------------------------------------------------------------------

  /** POST /v1/orgs/{orgID}/documents */
  async syncDocuments(
    req: OrgSyncDocumentsRequest,
    opts: RequestOptions = {},
  ): Promise<OrgSyncDocumentsResponse> {
    const body: Record<string, unknown> = {
      user_id: req.user_id,
      source_type: req.source_type,
      shared: req.shared,
      documents: req.documents,
    };
    return this.send<OrgSyncDocumentsResponse>(
      {
        method: "POST",
        path: `/v1/orgs/${encodeURIComponent(req.orgId)}/documents`,
        body,
      },
      opts,
    );
  }

  /** GET /v1/orgs/{orgID}/shared/indexes */
  async listSharedIndexes(orgId: string, opts: RequestOptions = {}): Promise<OrgIndexListResponse> {
    return this.send<OrgIndexListResponse>(
      {
        method: "GET",
        path: `/v1/orgs/${encodeURIComponent(orgId)}/shared/indexes`,
      },
      { ...opts, idempotent: true },
    );
  }

  /** GET /v1/orgs/{orgID}/users/{userID}/indexes */
  async listUserIndexes(
    orgId: string,
    userId: string,
    opts: RequestOptions = {},
  ): Promise<OrgIndexListResponse> {
    return this.send<OrgIndexListResponse>(
      {
        method: "GET",
        path: `/v1/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}/indexes`,
      },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Jobs (hot-model-switch + read/list)
  // -------------------------------------------------------------------------

  /** PATCH /v1/tenants/{tid}/indexes/{iid}/embedding-model */
  async switchEmbeddingModel(
    req: SwitchEmbeddingModelRequest,
    opts: RequestOptions = {},
  ): Promise<SwitchEmbeddingModelResponse> {
    const tenantId = req.tenantId ?? this.requireTenant(opts);
    const body: Record<string, unknown> = {
      embedding_backend: req.embedding_backend,
      model: req.model,
      dimension: req.dimension,
    };
    if (req.endpoint_override !== undefined) body.endpoint_override = req.endpoint_override;
    if (req.api_key !== undefined) body.api_key = req.api_key;
    return this.send<SwitchEmbeddingModelResponse>(
      {
        method: "PATCH",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(req.indexId)}/embedding-model`,
        body,
      },
      opts,
    );
  }

  /** GET /v1/jobs/{jobID} */
  async getJob(jobId: string, opts: RequestOptions = {}): Promise<Job> {
    return this.send<Job>(
      { method: "GET", path: `/v1/jobs/${encodeURIComponent(jobId)}` },
      { ...opts, idempotent: true },
    );
  }

  /** GET /v1/jobs or /v1/tenants/{tid}/jobs */
  async listJobs(args: ListJobsOptions = {}, opts: RequestOptions = {}): Promise<ListJobsResponse> {
    const query: Record<string, string | number | undefined> = {};
    if (args.status !== undefined) query.status = args.status;
    if (args.cursor !== undefined) query.cursor = args.cursor;
    if (args.limit !== undefined) query.limit = args.limit;

    let path: string;
    if (args.scope === "all") {
      path = "/v1/jobs";
    } else {
      const tenantId = args.tenantId ?? this.requireTenant(opts);
      path = `/v1/tenants/${encodeURIComponent(tenantId)}/jobs`;
    }
    return this.send<ListJobsResponse>(
      { method: "GET", path, query },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Cluster (read-only)
  // -------------------------------------------------------------------------

  /** GET /v1/cluster/nodes (Admin) */
  async getClusterNodes(opts: RequestOptions = {}): Promise<ClusterNodesResponse> {
    return this.send<ClusterNodesResponse>(
      { method: "GET", path: "/v1/cluster/nodes" },
      { ...opts, idempotent: true },
    );
  }

  /** GET /v1/cluster/shards (Admin) */
  async getClusterShards(opts: RequestOptions = {}): Promise<ClusterShardsResponse> {
    return this.send<ClusterShardsResponse>(
      { method: "GET", path: "/v1/cluster/shards" },
      { ...opts, idempotent: true },
    );
  }

  /** GET /v1/cluster/health */
  async getClusterHealth(opts: RequestOptions = {}): Promise<ClusterHealthResponse> {
    return this.send<ClusterHealthResponse>(
      { method: "GET", path: "/v1/cluster/health" },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // LLM Settings (org-scoped)
  //
  // Server route is /v1/orgs/{orgID}/llm-settings — the older /settings/llm
  // path was removed before the SDK shipped. Updates are partial-merge via
  // PATCH; pass only the fields you want to change. DELETE resets to
  // server defaults.
  // -------------------------------------------------------------------------

  /** GET /v1/orgs/{orgID}/llm-settings */
  async getLLMSettings(orgId: string, opts: RequestOptions = {}): Promise<LLMSettings> {
    return this.send<LLMSettings>(
      {
        method: "GET",
        path: `/v1/orgs/${encodeURIComponent(orgId)}/llm-settings`,
      },
      { ...opts, idempotent: true },
    );
  }

  /** PATCH /v1/orgs/{orgID}/llm-settings (partial merge) */
  async updateLLMSettings(
    orgId: string,
    settings: Partial<LLMSettings>,
    opts: RequestOptions = {},
  ): Promise<UpdateLLMSettingsResponse> {
    return this.send<UpdateLLMSettingsResponse>(
      {
        method: "PATCH",
        path: `/v1/orgs/${encodeURIComponent(orgId)}/llm-settings`,
        body: settings,
      },
      opts,
    );
  }

  /** DELETE /v1/orgs/{orgID}/llm-settings */
  async deleteLLMSettings(
    orgId: string,
    opts: RequestOptions = {},
  ): Promise<DeleteLLMSettingsResponse> {
    return this.send<DeleteLLMSettingsResponse>(
      {
        method: "DELETE",
        path: `/v1/orgs/${encodeURIComponent(orgId)}/llm-settings`,
      },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // API keys
  // -------------------------------------------------------------------------

  /** POST /v1/tenants/{tid}/api-keys */
  async createAPIKey(req: CreateAPIKeyRequest, opts: RequestOptions = {}): Promise<APIKey> {
    const tenantId = req.tenantId ?? this.requireTenant(opts);
    const body = { name: req.name, user_id: req.user_id };
    return this.send<APIKey>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/api-keys`,
        body,
      },
      opts,
    );
  }

  /** GET /v1/tenants/{tid}/api-keys */
  async listAPIKeys(opts: RequestOptions = {}): Promise<ListAPIKeysResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ListAPIKeysResponse>(
      {
        method: "GET",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/api-keys`,
      },
      { ...opts, idempotent: true },
    );
  }

  /** DELETE /v1/tenants/{tid}/api-keys/{keyId} */
  async revokeAPIKey(keyId: string, opts: RequestOptions = {}): Promise<void> {
    const tenantId = this.requireTenant(opts);
    await this.send<void>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/api-keys/${encodeURIComponent(keyId)}`,
      },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // Resources (atomic upsert)
  // -------------------------------------------------------------------------

  /**
   * PUT /v1/tenants/{tid}/indexes/{iid}/resources/{resourceID}
   *
   * Atomically creates or replaces a named resource: parses the text, chunks
   * it, embeds it, and swaps any prior chunks for this resource in one round-
   * trip. The response indicates whether the resource was `"create"`d or
   * `"update"`d and how many chunks were added / tombstoned.
   */
  async upsertResource(
    indexId: IndexID,
    resourceId: string,
    req: UpsertResourceRequest,
    opts: RequestOptions = {},
  ): Promise<UpsertResourceResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<UpsertResourceResponse>(
      {
        method: "PUT",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/resources/${encodeURIComponent(resourceId)}`,
        body: req,
      },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // Batch search
  // -------------------------------------------------------------------------

  /**
   * POST /v1/tenants/{tid}/indexes/{iid}/search/batch
   *
   * Runs multiple independent queries against one index in a single HTTP
   * request — amortizes per-request socket overhead for offline/pipeline
   * callers (evaluation runs, reranking stages, migrations). Capped at 128
   * queries per request. One query failing does not fail the batch: its
   * slot in the response carries `error` instead of `results`/`total`.
   */
  async batchSearch(
    indexId: IndexID,
    queries: BatchSearchRequest["queries"],
    opts: RequestOptions = {},
  ): Promise<BatchSearchResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<BatchSearchResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/search/batch`,
        body: { queries },
      },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Index maintenance: compact-all
  // -------------------------------------------------------------------------

  /**
   * POST /v1/tenants/{tid}/indexes/compact-all
   *
   * Queues every index owned by the tenant onto the compaction scheduler;
   * indexes compact one at a time. An index already queued or in flight is
   * reported in `skipped` rather than re-queued. Throws `ConflictError`
   * (HTTP 409) when the server has no compaction scheduler wired. Track
   * progress via `listJobs`.
   */
  async compactAllIndexes(opts: RequestOptions = {}): Promise<CompactAllResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<CompactAllResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/compact-all`,
      },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // License
  // -------------------------------------------------------------------------

  /**
   * GET /v1/license/status
   *
   * Unauthenticated, like `health`. Returns this node's license activation
   * state, entitlements, and fingerprint match — `current_fingerprint` is
   * what to paste into the licensing panel to rebind. 404s (not 501) when
   * the server was started without a license manager.
   */
  async getLicenseStatus(opts: RequestOptions = {}): Promise<LicenseStatus> {
    return this.send<LicenseStatus>(
      { method: "GET", path: "/v1/license/status", signal: opts.signal },
      { ...opts, idempotent: true },
    );
  }

  /**
   * GET /v1/license/audit
   *
   * This node's own local license state-transition history, newest first —
   * not the staff panel's cross-customer audit trail. Unauthenticated, same
   * posture as `getLicenseStatus`.
   *
   * @param limit Maximum events to return. Omitted, zero, negative, or
   *   greater than 1000 are all clamped to 1000 server-side.
   */
  async getLicenseAudit(limit?: number, opts: RequestOptions = {}): Promise<LicenseAuditEvent[]> {
    const query: Record<string, number | undefined> = {};
    if (limit !== undefined) query.limit = limit;
    return this.send<LicenseAuditEvent[]>(
      {
        method: "GET",
        path: "/v1/license/audit",
        ...(Object.keys(query).length > 0 ? { query } : {}),
        signal: opts.signal,
      },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Admin: fleet embedding-space observability
  // -------------------------------------------------------------------------

  /**
   * GET /v1/admin/embed-space
   *
   * Fleet-wide answer to "how many indexes are actually being
   * fingerprint-checked, and which ones are not" — one row per catalog
   * index (cold indexes included; their on-disk header is peeked, not
   * loaded). `sum(counts.values())` always equals `indexes.length`.
   */
  async getEmbedSpaceAdmin(opts: RequestOptions = {}): Promise<EmbedSpaceAdminResponse> {
    return this.send<EmbedSpaceAdminResponse>(
      { method: "GET", path: "/v1/admin/embed-space" },
      { ...opts, idempotent: true },
    );
  }

  // -------------------------------------------------------------------------
  // Backups
  // -------------------------------------------------------------------------

  /**
   * POST /v1/tenants/{tid}/indexes/{iid}/backups
   *
   * Snapshots the index into the server's configured filesystem backup
   * storage and returns the new backup id plus its manifest. Only mounted
   * when the server was started with `--backup-dir`; throws (HTTP 501,
   * `NotImplementedError`-shaped) otherwise so callers can distinguish
   * "backups are off" from "route missing" (404).
   */
  async createBackup(indexId: IndexID, opts: RequestOptions = {}): Promise<CreateBackupResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<CreateBackupResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/backups`,
      },
      opts,
    );
  }

  /** GET /v1/tenants/{tid}/backups — every backup summary for the tenant. */
  async listBackups(opts: RequestOptions = {}): Promise<ListBackupsResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<ListBackupsResponse>(
      { method: "GET", path: `/v1/tenants/${encodeURIComponent(tenantId)}/backups` },
      { ...opts, idempotent: true },
    );
  }

  /**
   * POST /v1/tenants/{tid}/backups/{backupID}/restore
   *
   * Restores the named backup into `destIndex` within the path tenant.
   * `backupId` is percent-encoded here because a backup id contains
   * slashes (it embeds the tenant, index, and timestamp).
   */
  async restoreBackup(
    backupId: string,
    destIndex: IndexID,
    opts: RequestOptions = {},
  ): Promise<RestoreBackupResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<RestoreBackupResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/backups/${encodeURIComponent(backupId)}/restore`,
        body: { dest_index: destIndex },
      },
      opts,
    );
  }

  /**
   * DELETE /v1/tenants/{tid}/backups/{backupID}
   *
   * Permanently deletes a backup from storage. `backupId` is
   * percent-encoded here because a backup id contains slashes.
   */
  async deleteBackup(backupId: string, opts: RequestOptions = {}): Promise<DeleteBackupResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<DeleteBackupResponse>(
      {
        method: "DELETE",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/backups/${encodeURIComponent(backupId)}`,
      },
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // Internal request dispatcher
  // -------------------------------------------------------------------------

  /**
   * Single dispatcher that all public methods route through. Handles:
   *   - merging per-call options into the http request
   *   - cache lookup/storage (only when `idempotent: true` and cache is on)
   *   - singleflight coalescing (only when `idempotent: true` and singleflight is on)
   *
   * Mutations bypass both layers and invalidate all cached reads on success.
   * Read-only POST requests are marked idempotent by their callers.
   */
  private async send<T>(
    req: HTTPRequest,
    flags: RequestOptions & { idempotent?: boolean } = {},
  ): Promise<T> {
    const merged: HTTPRequest = {
      ...req,
      signal: flags.signal ?? req.signal,
      timeoutMs: flags.timeout ?? req.timeoutMs,
      headers: {
        ...(req.headers ?? {}),
        ...(flags.tenantId ? { "x-tenant-id": flags.tenantId } : {}),
        ...(flags.headers ?? {}),
      },
    };

    const generation = this.generation;
    const key =
      flags.idempotent && (this.cache !== null || this.opts.singleflight)
        ? `${generation} ${merged.method} ${merged.path}?${stableHash(merged.query ?? null)} :: ${stableHash(merged.body ?? null)} :: ${stableHash(merged.headers ?? null)}`
        : "";

    if (flags.idempotent && this.cache !== null && !flags.bypassCache && key) {
      const hit = this.cache.get(key);
      if (hit !== undefined) {
        this.opts.metricsHook?.("cache.hit", 1, { path: merged.path });
        return hit as T;
      }
      this.opts.metricsHook?.("cache.miss", 1, { path: merged.path });
    }

    const exec = async (): Promise<T> => {
      const result = await request<T>(this.opts, merged);
      if (!flags.idempotent) {
        this.generation++;
        this.cache?.clear();
      } else if (
        generation === this.generation &&
        this.cache !== null &&
        !flags.bypassCache &&
        key
      ) {
        this.cache.set(key, result);
      }
      return result;
    };

    if (flags.idempotent && this.opts.singleflight && !flags.bypassSingleflight && key) {
      if (this.singleflight.has(key)) {
        this.opts.metricsHook?.("singleflight.coalesced", 1, { path: merged.path });
      }
      return this.singleflight.do(key, exec) as Promise<T>;
    }
    return exec();
  }

  private requireTenant(opts: RequestOptions): TenantID {
    const tenantId = opts.tenantId ?? this.opts.tenantId;
    if (!tenantId) {
      throw new GraphANNError(
        "tenantId is required: pass it in ClientOptions or in the per-request options",
      );
    }
    return tenantId;
  }
}
