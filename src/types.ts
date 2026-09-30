/**
 * TypeScript types for the GraphANN HTTP API.
 *
 * Wire-shape types (request/response bodies) are thin aliases over the
 * generated `components["schemas"]` types in `./generated/types.ts`, which
 * are themselves derived from `api/openapi/spec.yaml` — the single source of
 * truth. This file exists to:
 *   - keep the public export names stable (some generated schema names
 *     differ from the names this SDK has always exported, e.g. `Tenant` vs
 *     generated `TenantResponse`);
 *   - compose client-side-only convenience shapes (options bags, method
 *     argument objects that mix a path/tenant override with a request body)
 *     that have no corresponding spec schema;
 *   - carry hand-written notes about server quirks the spec doesn't state
 *     as a JSON Schema constraint (mutually-exclusive fields, 500-vs-400
 *     surprises, etc).
 *
 * Field names mirror the on-the-wire snake_case schema. Keep it pure data —
 * runtime helpers belong in `client.ts`.
 */

import type { components } from "./generated/types.js";

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

export type TenantID = string;
export type IndexID = string;
export type JobID = string;

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export type HealthResponse = components["schemas"]["HealthResponse"] & {
  reason?: string;
};

/** `GET /ready` body: `status` is `"ready"`, or a 503 carries `reason` while warming up. */
export type ReadyResponse = components["schemas"]["ReadyResponse"];

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

/** `GET /v1/tenants/{id}` body. Carries neither `index_count` nor `metadata` (those are list-only). */
export type Tenant = components["schemas"]["TenantDetailResponse"];

/** `POST /v1/tenants` body. Has no `updated_at`. */
export type CreateTenantResponse = components["schemas"]["TenantResponse"];

/** Element of `listTenants().tenants`; adds `index_count` and `metadata`. */
export type TenantListEntry = components["schemas"]["TenantListEntry"];

export type CreateTenantRequest = components["schemas"]["CreateTenantRequest"];

export type ListTenantsResponse = components["schemas"]["ListTenantsResponse"];

export type DeleteTenantResponse = components["schemas"]["DeleteTenantResponse"];

export type TenantQuotaResponse = components["schemas"]["TenantQuotaResponse"];

export type UpdateTenantQuotaRequest = components["schemas"]["UpdateTenantQuotaRequest"];

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export type IndexStatus = "pending" | "building" | "ready" | "error" | "deleted";

export type IndexInfo = components["schemas"]["IndexInfo"];

export type CompressionType = components["schemas"]["Compression"];

export type CreateIndexRequest = components["schemas"]["CreateIndexRequest"];

export type UpdateIndexRequest = components["schemas"]["UpdateIndexRequest"];

export type ListIndexesResponse = components["schemas"]["ListIndexesResponse"];

export type IndexStatusResponse = components["schemas"]["IndexStatusResponse"];

export type CompactIndexResponse = components["schemas"]["CompactResponse"];

export type ClearIndexResponse = components["schemas"]["ClearResponse"];

export type LiveIndexStats = components["schemas"]["LiveStatsResponse"];

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type Document = components["schemas"]["Document"];

/** Body accepted by `Client.addDocuments`. `defer_save`/`bulk` are optional client-side (server defaults both to false). */
export type AddDocumentsRequest = {
  documents: Document[];
} & Partial<Pick<components["schemas"]["AddDocumentsRequest"], "defer_save" | "bulk">>;

export type AddDocumentsResponse = components["schemas"]["AddDocumentsResponse"];

/** Body returned by `POST .../indexes/{id}/flush`. */
export type FlushIndexResponse = components["schemas"]["FlushIndexResponse"];

/** Body returned by `POST .../indexes/{id}/rebuild-graph`. */
export type RebuildGraphResponse = components["schemas"]["RebuildGraphResponse"];

export type ImportDocumentsResponse = components["schemas"]["ImportDocumentsResponse"];

export type PendingStatusResponse = components["schemas"]["PendingStatusResponse"];

export type ProcessPendingResponse = components["schemas"]["ProcessPendingResponse"];

export type ClearPendingResponse = components["schemas"]["ClearPendingResponse"];

export type ListDocumentEntry = components["schemas"]["ListDocumentEntry"];

export type ListDocumentsPage = components["schemas"]["ListDocumentsResponse"];

/** Options for `client.listDocuments`. */
export interface ListDocumentsOptions {
  indexId: IndexID;
  prefix?: string;
  limit?: number;
  /** Tenant override when not set on the client. */
  tenantId?: TenantID;
}

export type BulkDeleteDocumentsRequest = components["schemas"]["BulkDeleteDocumentsRequest"];

export type BulkDeleteDocumentsResponse = components["schemas"]["BulkDeleteDocumentsResponse"];

export type BulkDeleteByExternalIdsRequest =
  components["schemas"]["BulkDeleteByExternalIDsRequest"];

export type BulkDeleteByExternalIdsResponse =
  components["schemas"]["BulkDeleteByExternalIDsResponse"];

export type DeleteDocumentResponse = components["schemas"]["DeleteDocumentResponse"];

export type DocumentChunk = components["schemas"]["GetDocumentChunk"];

export type GetDocumentResponse = components["schemas"]["GetDocumentResponse"];

/**
 * Body returned by `POST /v1/admin/cleanup-orphans`.
 *
 * `min_age` is a Go-style duration string echoing the cutoff the server
 * actually applied (e.g. `"1h0m0s"`, `"24h0m0s"`). `dry_run` echoes the
 * dry-run flag — when true, `removed` is what would have been deleted, not
 * what was deleted.
 */
export type CleanupOrphansResponse = components["schemas"]["AdminCleanupResponse"];

/**
 * Body returned by both `POST .../indexes/{id}/gc` and `POST /v1/admin/gc`.
 * The per-index route additionally echoes `index_id`; admin GC does not.
 */
export type GCResponse =
  | components["schemas"]["GCResponse"]
  | components["schemas"]["AdminGCResponse"];

export type ChunkResponse = components["schemas"]["ChunkResponse"];

export type DeleteChunksResponse = components["schemas"]["DeleteChunksResponse"];

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** `omit_text` has a server-side default (`false`), so it's optional here even though the spec marks it always-present in the wire shape. */
export type SearchFilter = Omit<components["schemas"]["SearchFilter"], "omit_text"> &
  Partial<Pick<components["schemas"]["SearchFilter"], "omit_text">>;

/** Body fields accepted by `POST .../search`, as sent on the wire. */
export type SearchRequestBody = Omit<components["schemas"]["SearchRequest"], "filter"> & {
  filter?: SearchFilter;
};

export type SearchRequest = Partial<SearchRequestBody> & {
  indexId: IndexID;
  /** Tenant override when not set on the client. */
  tenantId?: TenantID;
};

export type SearchResult = components["schemas"]["SearchResult"];

export type SearchResponse = components["schemas"]["SearchResponse"];

/**
 * Body of `POST .../search/batch`. Each entry in `queries` accepts the same
 * (relaxed-optional) shape as `/search`'s body — capped at 128 entries per
 * request.
 */
export type BatchSearchRequest = {
  queries: Partial<SearchRequestBody>[];
};

export type BatchSearchResult = components["schemas"]["BatchSearchResult"];

export type BatchSearchResponse = components["schemas"]["BatchSearchResponse"];

// Multi-source / org-level search.

export type MultiSearchRequest = Partial<
  Omit<components["schemas"]["MultiSearchRequest"], "query">
> & {
  orgId: string;
  userId: string;
  query: string;
};

export type MultiSearchResult = components["schemas"]["MultiSearchResult"];

export type MultiSearchResponse = components["schemas"]["MultiSearchResponse"];

// ---------------------------------------------------------------------------
// Jobs (hot model switch + read/list)
// ---------------------------------------------------------------------------

export type JobKind = "reembed";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export type JobProgress = components["schemas"]["JobProgress"];

export type Job = components["schemas"]["Job"];

export type SwitchEmbeddingModelRequest = Partial<
  Omit<
    components["schemas"]["SwitchEmbeddingModelRequest"],
    "embedding_backend" | "model" | "dimension"
  >
> & {
  indexId: IndexID;
  embedding_backend: components["schemas"]["SwitchEmbeddingModelRequest"]["embedding_backend"];
  model: string;
  dimension: number;
  tenantId?: TenantID;
};

export type SwitchEmbeddingModelResponse = components["schemas"]["SwitchEmbeddingModelResponse"];

export interface ListJobsOptions {
  /** Scope to a specific tenant; falls back to client default when omitted. */
  tenantId?: TenantID;
  /** Pass `"all"` to use the admin /v1/jobs endpoint. */
  scope?: "tenant" | "all";
  status?: JobStatus;
  cursor?: string;
  limit?: number;
}

export type ListJobsResponse = components["schemas"]["JobListResponse"];

// ---------------------------------------------------------------------------
// Cluster
// ---------------------------------------------------------------------------

export type ClusterNodeState = "alive" | "suspect" | "dead";

export type ClusterNode = components["schemas"]["ClusterNodeView"];

export type ClusterShard = components["schemas"]["ClusterShardView"];

export type ClusterNodesResponse = components["schemas"]["ListClusterNodesResponse"];

export type ClusterShardsResponse = components["schemas"]["ListClusterShardsResponse"];

export type ClusterHealthResponse = components["schemas"]["ClusterHealthResponse"];

// ---------------------------------------------------------------------------
// LLM Settings
// ---------------------------------------------------------------------------

export type LLMProvider = "openai" | "ollama" | "anthropic";

export type LLMSettings = components["schemas"]["LLMSettings"];

export type LLMSettingsPatch = components["schemas"]["LLMSettingsPatch"];

/** The server answers PATCH with the merged settings (`api_key` masked), not an envelope. */
export type UpdateLLMSettingsResponse = LLMSettings;

/** The server answers DELETE with the reset defaults. */
export type DeleteLLMSettingsResponse = LLMSettings;

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

/** Response from creating an API key. The `plaintext` secret is returned ONCE. */
export type APIKey = components["schemas"]["CreateAPIKeyResponse"];

/** An entry in the list-keys response. Never includes the plaintext secret. */
export type APIKeyListItem = components["schemas"]["APIKeyListItem"];

export type CreateAPIKeyRequest = components["schemas"]["CreateAPIKeyRequest"] & {
  tenantId?: TenantID;
};

export type ListAPIKeysResponse = components["schemas"]["ListAPIKeysResponse"];

// ---------------------------------------------------------------------------
// Org-level
// ---------------------------------------------------------------------------

export type OrgDocumentInput = components["schemas"]["SyncDocumentInput"];

export type OrgSyncDocumentsRequest = Omit<
  components["schemas"]["SyncDocumentsRequest"],
  "documents"
> & {
  orgId: string;
  documents: OrgDocumentInput[];
};

export type OrgSyncDocumentsResponse = components["schemas"]["SyncDocumentsResponse"];

export type OrgIndexListResponse = components["schemas"]["OrgIndexListResponse"];

export type SharedIndexListResponse = components["schemas"]["SharedIndexListResponse"];

// ---------------------------------------------------------------------------
// Resources (atomic upsert)
// ---------------------------------------------------------------------------

export type UpsertResourceRequest = components["schemas"]["UpsertResourceRequest"];

export type UpsertResourceResponse = components["schemas"]["UpsertResourceResponse"];

// ---------------------------------------------------------------------------
// License
// ---------------------------------------------------------------------------

export type LicenseStatus = components["schemas"]["LicenseStatus"];

export type LicenseAuditEvent = components["schemas"]["LicenseAuditEvent"];

// ---------------------------------------------------------------------------
// Admin: fleet embedding-space observability
// ---------------------------------------------------------------------------

export type EmbedSpaceIndexRow = components["schemas"]["EmbedSpaceIndexRow"];

export type EmbedSpaceAdminResponse = components["schemas"]["EmbedSpaceAdminResponse"];

// ---------------------------------------------------------------------------
// Admin: API-key status
// ---------------------------------------------------------------------------

export type APIKeyStatusTenantRow = components["schemas"]["APIKeyStatusTenantRow"];

export type APIKeyStatusResponse = components["schemas"]["APIKeyStatusResponse"];

// ---------------------------------------------------------------------------
// Index maintenance: compact-all
// ---------------------------------------------------------------------------

export type CompactAllSkipped = components["schemas"]["CompactAllSkipped"];

export type CompactAllResponse = components["schemas"]["CompactAllResponse"];

// ---------------------------------------------------------------------------
// Backups
// ---------------------------------------------------------------------------

export type BackupChunkInfo = components["schemas"]["BackupChunkInfo"];

export type BackupMeta = components["schemas"]["BackupMeta"];

export type BackupManifest = components["schemas"]["BackupManifest"];

export type CreateBackupResponse = components["schemas"]["CreateBackupResponse"];

/**
 * Condensed view returned by list-backups. NOTE: this struct has no JSON
 * tags on the server, so the field names are the Go field names verbatim
 * (capitalized), not the snake_case used elsewhere in this API.
 */
export type BackupSummary = components["schemas"]["BackupSummary"];

export type ListBackupsResponse = components["schemas"]["ListBackupsResponse"];

export type AdminBackupRow = components["schemas"]["AdminBackupRow"];

export type AdminBackupList = components["schemas"]["AdminBackupList"];

export type BackupScheduleStatus = components["schemas"]["BackupScheduleStatus"];

/** Filters and paging for `client.listAllBackups`. */
export interface ListAllBackupsOptions {
  tenantId?: TenantID;
  indexId?: IndexID;
  /** Server default 200, max 1000. */
  limit?: number;
  /** `next_cursor` from the previous page. */
  cursor?: string;
}

export type RestoreBackupRequest = components["schemas"]["RestoreBackupRequest"];

export type RestoreBackupResponse = components["schemas"]["RestoreBackupResponse"];

export type DeleteBackupResponse = components["schemas"]["DeleteBackupResponse"];

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** Wire shape of a server-emitted error envelope. */
export type ServerErrorEnvelope = components["schemas"]["ErrorEnvelope"];

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
