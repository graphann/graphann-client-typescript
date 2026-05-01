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
import {
  type ClientOptions,
  resolveOptions,
  type ResolvedClientOptions,
} from "./options.js";
import { Paginator } from "./pagination.js";
import { SingleFlight, stableHash } from "./singleflight.js";
import type {
  AddDocumentsResponse,
  APIKey,
  BulkDeleteByExternalIdsResponse,
  BulkDeleteDocumentsResponse,
  ChunkResponse,
  ClearIndexResponse,
  ClearPendingResponse,
  ClusterHealthResponse,
  ClusterNodesResponse,
  ClusterShardsResponse,
  CompactIndexResponse,
  CleanupOrphansResponse,
  CreateAPIKeyRequest,
  GCResponse,
  CreateIndexRequest,
  CreateTenantRequest,
  DeleteChunksResponse,
  DeleteDocumentResponse,
  DeleteLLMSettingsResponse,
  DeleteTenantResponse,
  Document,
  GetDocumentResponse,
  HealthResponse,
  IndexID,
  IndexInfo,
  IndexStatusResponse,
  ImportDocumentsResponse,
  Job,
  ListAPIKeysResponse,
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
  RequestOptions,
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
    return this.send<Tenant>(
      { method: "POST", path: "/v1/tenants", body: req },
      opts,
    );
  }

  /** GET /v1/tenants/{id} */
  async getTenant(tenantId: TenantID, opts: RequestOptions = {}): Promise<Tenant> {
    return this.send<Tenant>(
      { method: "GET", path: `/v1/tenants/${encodeURIComponent(tenantId)}` },
      { ...opts, idempotent: true },
    );
  }

  /** DELETE /v1/tenants/{id} */
  async deleteTenant(
    tenantId: TenantID,
    opts: RequestOptions = {},
  ): Promise<DeleteTenantResponse> {
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
  async getIndexStatus(
    indexId: IndexID,
    opts: RequestOptions = {},
  ): Promise<IndexStatusResponse> {
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
   * Throws `ConflictError` (HTTP 409) when a compaction is already running.
   * Callers should catch and retry after a back-off.
   */
  async compactIndex(
    indexId: IndexID,
    opts: RequestOptions = {},
  ): Promise<CompactIndexResponse> {
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
  async clearPending(
    indexId: IndexID,
    opts: RequestOptions = {},
  ): Promise<ClearPendingResponse> {
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

  /** POST /v1/tenants/{tid}/indexes/{iid}/documents */
  async addDocuments(
    indexId: IndexID,
    documents: Document[],
    opts: RequestOptions = {},
  ): Promise<AddDocumentsResponse> {
    const tenantId = this.requireTenant(opts);
    return this.send<AddDocumentsResponse>(
      {
        method: "POST",
        path: `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(indexId)}/documents`,
        body: { documents },
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
  listDocuments(args: ListDocumentsOptions, opts: RequestOptions = {}): Paginator<{
    id: string;
    text?: string;
    metadata?: Record<string, unknown>;
  }> {
    const tenantId = args.tenantId ?? this.requireTenant(opts);
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}/indexes/${encodeURIComponent(args.indexId)}/documents`;
    const fetcher = async (
      cursor: string | undefined,
      signal?: AbortSignal,
    ): Promise<Page<{ id: string; text?: string; metadata?: Record<string, unknown> }>> => {
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
    if (!req.query && (!req.vector || req.vector.length === 0)) {
      throw new GraphANNError("search() requires either `query` or `vector`");
    }
    const body: Record<string, unknown> = {};
    if (req.query !== undefined) body.query = req.query;
    if (req.vector !== undefined) body.vector = req.vector;
    if (req.k !== undefined) body.k = req.k;
    if (req.filter !== undefined) body.filter = req.filter;
    if (req.rerank !== undefined) body.rerank = req.rerank;
    if (req.candidate_k !== undefined) body.candidate_k = req.candidate_k;
    if (req.rerank_k !== undefined) body.rerank_k = req.rerank_k;
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
  async listSharedIndexes(
    orgId: string,
    opts: RequestOptions = {},
  ): Promise<OrgIndexListResponse> {
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
  //
  // These call routes the GraphANN server has not yet shipped (the auth
  // middleware reads keys but no HTTP CRUD exists at the time of writing).
  // Methods are kept on the public surface so application code can compile
  // ahead of the server-side rollout — calls will surface a NotFoundError
  // until the routes land.
  // -------------------------------------------------------------------------

  /** POST /v1/tenants/{tid}/api-keys */
  async createAPIKey(req: CreateAPIKeyRequest, opts: RequestOptions = {}): Promise<APIKey> {
    const tenantId = req.tenantId ?? this.requireTenant(opts);
    const body: Record<string, unknown> = { name: req.name };
    if (req.role !== undefined) body.role = req.role;
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
  // Internal request dispatcher
  // -------------------------------------------------------------------------

  /**
   * Single dispatcher that all public methods route through. Handles:
   *   - merging per-call options into the http request
   *   - cache lookup/storage (only when `idempotent: true` and cache is on)
   *   - singleflight coalescing (only when `idempotent: true` and singleflight is on)
   *
   * Mutating requests (POST/PUT/PATCH/DELETE) bypass both layers.
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

    const key =
      flags.idempotent && (this.cache !== null || this.opts.singleflight)
        ? `${merged.method} ${merged.path}?${stableHash(merged.query ?? null)} :: ${stableHash(merged.body ?? null)}`
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
      if (flags.idempotent && this.cache !== null && !flags.bypassCache && key) {
        this.cache.set(key, result);
      }
      return result;
    };

    if (
      flags.idempotent &&
      this.opts.singleflight &&
      !flags.bypassSingleflight &&
      key
    ) {
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
