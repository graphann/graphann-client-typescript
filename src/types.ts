/**
 * TypeScript types for the GraphANN HTTP API.
 *
 * Field names mirror the on-the-wire snake_case schema. Keep this file pure
 * data — runtime helpers belong in `client.ts`. Server source of truth lives
 * in `internal/server/handlers.go`, `internal/tenant/types.go`, and friends.
 */

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

export type TenantID = string;
export type IndexID = string;
export type JobID = string;

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

export interface Tenant {
  id: TenantID;
  name: string;
  created_at: string;
  updated_at?: string;
  index_count?: number;
  metadata?: Record<string, string>;
}

export interface CreateTenantRequest {
  /** Optional explicit ID for idempotent creation. */
  id?: string;
  name: string;
}

export interface ListTenantsResponse {
  tenants: Tenant[];
  total: number;
}

export interface DeleteTenantResponse {
  deleted: true;
  tenant_id: TenantID;
  name: string;
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export type IndexStatus = "pending" | "empty" | "building" | "ready" | "error" | "deleted";

export interface IndexInfo {
  id: IndexID;
  tenant_id: TenantID;
  name: string;
  description?: string;
  dimension: number;
  num_chunks: number;
  num_docs: number;
  status: IndexStatus;
  error?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  path?: string;
  metadata?: Record<string, string>;
  compression?: string;
  approximate?: boolean;
}

export type CompressionType = "none" | "scalar" | "binary" | "pq" | "recompute" | "";

export interface CreateIndexRequest {
  /** Optional explicit ID for idempotent creation. */
  id?: string;
  name: string;
  description?: string;
  compression?: CompressionType;
  approximate?: boolean;
}

export interface UpdateIndexRequest {
  name?: string;
  description?: string;
  compression?: CompressionType;
  approximate?: boolean;
}

export interface ListIndexesResponse {
  indexes: IndexInfo[];
  total: number;
}

export interface IndexStatusResponse {
  index_id: IndexID;
  status: IndexStatus;
  error?: string;
}

export interface CompactIndexResponse {
  index_id: IndexID;
  status: string;
  message: string;
}

export interface ClearIndexResponse {
  index_id: IndexID;
  status: string;
  message: string;
}

export interface LiveIndexStats {
  index_id: IndexID;
  is_live: boolean;
  base_chunks?: number;
  delta_chunks?: number;
  total_chunks?: number;
  deleted_chunks?: number;
  live_chunks?: number;
  documents?: number;
  num_chunks?: number;
  num_docs?: number;
  dimension: number;
  is_dirty?: boolean;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface Document {
  /** Optional client-supplied external ID. */
  id?: string;
  text: string;
  /** Alias for `text` accepted by the server. */
  content?: string;
  metadata?: Record<string, unknown>;
  /** When `true`, replace existing chunks for this external ID. */
  upsert?: boolean;
  /** RFC3339 timestamp; chunks become invisible after expiry. */
  expires_at?: string;
  repo_id?: string;
  file_path?: string;
  commit_sha?: string;
}

export interface AddDocumentsRequest {
  documents: Document[];
}

export interface AddDocumentsResponse {
  added: number;
  index_id: IndexID;
  // Server emits []store.ChunkID (= []string) UUIDs, not numbers.
  chunk_ids: string[];
}

export interface ImportDocumentsResponse {
  imported: number;
  index_id: IndexID;
  document_ids: number[];
  pending_total: number;
  status: string;
  message?: string;
}

export interface PendingStatusResponse {
  index_id: IndexID;
  pending_count: number;
}

export interface ProcessPendingResponse {
  index_id: IndexID;
  processed: number;
  chunks_created: number;
  // Server emits []store.ChunkID (= []string) UUIDs, not numbers.
  chunk_ids?: string[];
}

export interface ClearPendingResponse {
  index_id: IndexID;
  status: string;
  message?: string;
  cleared?: number;
}

export interface ListDocumentEntry {
  id: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface ListDocumentsPage {
  documents: ListDocumentEntry[];
  next_cursor?: string;
}

/** Options for `client.listDocuments`. */
export interface ListDocumentsOptions {
  indexId: IndexID;
  prefix?: string;
  limit?: number;
  /** Tenant override when not set on the client. */
  tenantId?: TenantID;
}

export interface BulkDeleteDocumentsRequest {
  document_ids: number[];
}

export interface BulkDeleteDocumentsResponse {
  index_id: IndexID;
  documents_deleted: number;
  chunks_deleted: number;
  deleted_per_doc: Record<string, number>;
}

export interface BulkDeleteByExternalIdsRequest {
  external_ids: string[];
}

export interface BulkDeleteByExternalIdsResponse {
  index_id: IndexID;
  documents_deleted: number;
  chunks_deleted: number;
  deleted_per_id: Record<string, number>;
}

export interface DeleteDocumentResponse {
  deleted_chunks: number;
  document_id: number;
  index_id: IndexID;
}

export interface DocumentChunk {
  chunk_id: number;
  uuid?: string;
  text: string;
  chunk_index: number;
  start: number;
  end: number;
  repo_id?: string;
  file_path?: string;
  commit_sha?: string;
}

export interface GetDocumentResponse {
  index_id: IndexID;
  document_id: number;
  external_id?: string;
  chunks: DocumentChunk[];
  total_chunks: number;
}

export interface CleanupOrphansResponse {
  removed: string[];
  freed_bytes: number;
}

/**
 * Body returned by both `POST .../indexes/{id}/gc` and `POST /v1/admin/gc`.
 * Reports the count of expired documents reclaimed.
 */
export interface GCResponse {
  /** Index id, present on per-index GC, omitted for admin GC. */
  index_id?: string;
  deleted_count: number;
}

export interface ChunkResponse {
  chunk_id: number;
  text?: string;
  document_id: number;
  chunk_index: number;
  start: number;
  end: number;
}

export interface DeleteChunksResponse {
  deleted: number;
  index_id: IndexID;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchFilter {
  repo_ids?: string[];
  exclude_external_ids?: string[];
  metadata_filter?: Record<string, unknown>;
  equals?: Record<string, string>;
}

export interface SearchRequest {
  indexId: IndexID;
  query?: string;
  vector?: number[];
  k?: number;
  filter?: SearchFilter;
  /** Tenant override when not set on the client. */
  tenantId?: TenantID;
}

export interface SearchResult {
  id: string;
  text?: string;
  score: number;
  metadata?: unknown;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

// Multi-source / org-level search.

export interface MultiSearchRequest {
  orgId: string;
  userId: string;
  query: string;
  k?: number;
  sources?: string[];
  ef_search?: number;
  include_text?: boolean;
  start_time?: number;
  end_time?: number;
  distance_threshold?: number;
}

export interface MultiSearchResult {
  chunk_id: number;
  text?: string;
  distance: number;
  source_type: string;
  repo_id?: string;
  metadata?: Record<string, unknown>;
  created_at?: number;
  shared?: boolean;
}

export interface MultiSearchResponse {
  results: MultiSearchResult[];
  total: number;
  query: string;
  org_id: string;
  user_id: string;
}

// ---------------------------------------------------------------------------
// Jobs (hot model switch + read/list)
// ---------------------------------------------------------------------------

export type JobKind = "reembed";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface JobProgress {
  chunks_done: number;
  chunks_total: number;
}

export interface Job {
  job_id: JobID;
  kind: JobKind;
  tenant_id: TenantID;
  index_id: IndexID;
  status: JobStatus;
  progress: JobProgress;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface SwitchEmbeddingModelRequest {
  indexId: IndexID;
  embedding_backend: "ollama" | "openai" | "local_onnx";
  model: string;
  dimension: number;
  endpoint_override?: string;
  api_key?: string;
  tenantId?: TenantID;
}

export interface SwitchEmbeddingModelResponse {
  job_id: JobID;
  status: JobStatus;
}

export interface ListJobsOptions {
  /** Scope to a specific tenant; falls back to client default when omitted. */
  tenantId?: TenantID;
  /** Pass `"all"` to use the admin /v1/jobs endpoint. */
  scope?: "tenant" | "all";
  status?: JobStatus;
  cursor?: string;
  limit?: number;
}

export interface ListJobsResponse {
  jobs: Job[];
  total: number;
  next_cursor?: string;
}

// ---------------------------------------------------------------------------
// Cluster
// ---------------------------------------------------------------------------

/**
 * Known cluster node states. Server may add new ones; consumers should treat
 * `state` as a string in switch fallthrough.
 */
export type ClusterNodeState = "alive" | "suspect" | "dead";

export interface ClusterNode {
  id: string;
  addr: string;
  zone?: string;
  /**
   * One of `"alive"`, `"suspect"`, `"dead"`, or another string the server
   * defines in the future. The intersection with `Record<never, never>` keeps
   * literal autocomplete available without forcing a closed union.
   */
  state: ClusterNodeState | (string & Record<never, never>);
  last_seen: string;
}

export interface ClusterShard {
  id: string;
  primary: string;
  replicas: string[];
  zone_placement?: Record<string, string>;
}

export interface ClusterNodesResponse {
  nodes: ClusterNode[];
  leader: string;
}

export interface ClusterShardsResponse {
  shards: ClusterShard[];
  rf: number;
}

export interface ClusterHealthResponse {
  status: "ok" | "degraded" | "unhealthy";
  cluster_size: number;
  alive_nodes: number;
  raft_has_leader: boolean;
  under_replicated_shards?: number;
}

// ---------------------------------------------------------------------------
// LLM Settings
// ---------------------------------------------------------------------------

/**
 * Known LLM provider types. Server may add new ones; treat as a string in
 * switch fallthrough.
 */
export type LLMProvider = "openai" | "ollama" | "anthropic";

export interface LLMSettings {
  /**
   * One of the known providers, or another string the server may introduce
   * later. The intersection with `Record<never, never>` keeps literal
   * autocomplete without forcing a closed union.
   */
  provider: LLMProvider | (string & Record<never, never>);
  model: string;
  api_key?: string;
  base_url?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface UpdateLLMSettingsResponse {
  message: string;
  org_id: string;
  settings: LLMSettings;
}

export interface DeleteLLMSettingsResponse {
  message: string;
  org_id: string;
  settings?: LLMSettings;
}

// ---------------------------------------------------------------------------
// API keys (forward-looking; server route may not yet exist)
// ---------------------------------------------------------------------------

export interface APIKey {
  id: string;
  tenant_id: TenantID;
  name: string;
  prefix?: string;
  /** Only returned on creation; full secret is never re-readable. */
  secret?: string;
  role?: string;
  created_at: string;
  last_used_at?: string;
  revoked_at?: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  role?: string;
  tenantId?: TenantID;
}

export interface ListAPIKeysResponse {
  api_keys: APIKey[];
  total: number;
}

// ---------------------------------------------------------------------------
// Org-level
// ---------------------------------------------------------------------------

export interface OrgDocumentInput {
  resource_id?: string;
  text: string;
  metadata?: Record<string, string>;
}

export interface OrgSyncDocumentsRequest {
  orgId: string;
  user_id: string;
  source_type: string;
  shared: boolean;
  documents: OrgDocumentInput[];
}

export interface OrgSyncDocumentsResponse {
  synced: number;
  org_id: string;
  user_id: string;
  source_type: string;
  index_type: "personal" | "shared";
}

export interface OrgIndexListResponse {
  indexes: IndexInfo[];
  total: number;
  org_id: string;
  /** Set when the listing is scoped to a user; absent for shared listings. */
  user_id?: string;
}

// ---------------------------------------------------------------------------
// Resources (atomic upsert)
// ---------------------------------------------------------------------------

export interface UpsertResourceRequest {
  text: string;
  metadata?: Record<string, string>;
}

export interface UpsertResourceResponse {
  resource_id: string;
  chunks_added: number;
  chunks_tombstoned: number;
  operation: "create" | "update";
}

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** Wire shape of a server-emitted error envelope. */
export interface ServerErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Per-request options accepted by every method. */
export interface RequestOptions {
  signal?: AbortSignal;
  /** Override the client-default tenant for this request. */
  tenantId?: TenantID;
  /** Override the default timeout (ms). */
  timeout?: number;
  /** Disable single-flight coalescing for this request. */
  bypassSingleflight?: boolean;
  /** Disable response caching for this request. */
  bypassCache?: boolean;
  /** Extra headers to merge into the request. */
  headers?: Record<string, string>;
}

/** Page envelope returned by the cursor pagination iterator. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
