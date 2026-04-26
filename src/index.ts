/**
 * Public entry point for `@graphann/client`.
 *
 * Re-exports only the surface application code needs. Internal helpers
 * (singleflight, retry math, cache) stay unexported to keep the API small
 * and the bundle tree-shakable.
 */

export { Client } from "./client.js";

export {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  GraphANNError,
  NetworkError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitError,
  ServerError,
  UnexpectedStatusError,
  ValidationError,
} from "./errors.js";

export type { ClientOptions } from "./options.js";
export { SDK_VERSION } from "./options.js";

export { Paginator } from "./pagination.js";

export type {
  AddDocumentsRequest,
  AddDocumentsResponse,
  APIKey,
  BuildIndexResponse,
  BulkDeleteByExternalIdsResponse,
  BulkDeleteDocumentsResponse,
  ChunkResponse,
  ClearIndexResponse,
  ClearPendingResponse,
  CleanupOrphansResponse,
  ClusterHealthResponse,
  ClusterNode,
  ClusterNodesResponse,
  ClusterShard,
  ClusterShardsResponse,
  CompactIndexResponse,
  CreateAPIKeyRequest,
  CreateIndexRequest,
  CreateTenantRequest,
  DeleteChunksResponse,
  DeleteDocumentResponse,
  DeleteLLMSettingsResponse,
  DeleteTenantResponse,
  Document,
  DocumentChunk,
  GetDocumentResponse,
  HealthResponse,
  ImportDocumentsResponse,
  IndexID,
  IndexInfo,
  IndexStatus,
  IndexStatusResponse,
  Job,
  JobID,
  JobKind,
  JobProgress,
  JobStatus,
  ListAPIKeysResponse,
  ListDocumentEntry,
  ListDocumentsOptions,
  ListIndexesResponse,
  ListJobsOptions,
  ListJobsResponse,
  ListTenantsResponse,
  LiveIndexStats,
  LLMSettings,
  MultiSearchRequest,
  MultiSearchResponse,
  MultiSearchResult,
  OrgDocumentInput,
  OrgIndexListResponse,
  OrgSyncDocumentsRequest,
  OrgSyncDocumentsResponse,
  Page,
  PendingStatusResponse,
  ProcessPendingResponse,
  RequestOptions,
  SearchFilter,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchTextRequest,
  SearchVectorRequest,
  ServerErrorEnvelope,
  SwitchEmbeddingModelRequest,
  SwitchEmbeddingModelResponse,
  Tenant,
  TenantID,
  UpdateIndexRequest,
  UpdateLLMSettingsResponse,
} from "./types.js";
