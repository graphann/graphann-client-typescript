/**
 * Spec-driven coverage: every operation in the vendored OpenAPI spec must be
 * reachable through an SDK method, hitting the exact METHOD + path template.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { Client } from "../src/client.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCAL_SPEC = join(HERE, "..", "api", "openapi", "spec.yaml");
const SPEC_PATH = existsSync(LOCAL_SPEC)
  ? LOCAL_SPEC
  : join(HERE, "..", "..", "api", "openapi", "spec.yaml");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

interface SpecOp {
  operationId: string;
  method: string;
  template: string;
}

function loadSpecOps(): SpecOp[] {
  const spec = parse(readFileSync(SPEC_PATH, "utf8")) as {
    paths: Record<string, Record<string, { operationId?: string }>>;
  };
  const ops: SpecOp[] = [];
  for (const [template, item] of Object.entries(spec.paths)) {
    for (const m of HTTP_METHODS) {
      const op = item[m];
      if (!op) continue;
      if (!op.operationId) throw new Error(`${m.toUpperCase()} ${template} has no operationId`);
      ops.push({ operationId: op.operationId, method: m.toUpperCase(), template });
    }
  }
  return ops;
}

interface Recorded {
  method: string;
  path: string;
}

function recordingClient(log: Recorded[]): Client {
  const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
    );
    log.push({ method: (init?.method ?? "GET").toUpperCase(), path: url.pathname });
    return Promise.resolve(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );
  }) as typeof fetch;
  return new Client({
    baseUrl: "http://graphann.test",
    tenantId: "t1",
    maxRetries: 0,
    fetch: fetchImpl,
  });
}

const P = {
  tenantID: "t1",
  indexID: "i1",
  docID: "d1",
  chunkID: "0",
  resourceID: "r1",
  orgID: "o1",
  userID: "u1",
  jobID: "j1",
  backupID: "b1",
  keyID: "k1",
};

type Call = (c: Client) => Promise<unknown>;

// One explicit entry per operationId.
const CALLS: Record<string, Call> = {
  healthCheck: (c) => c.health(),
  readinessCheck: (c) => c.ready(),
  getLicenseStatus: (c) => c.getLicenseStatus(),
  getLicenseAudit: (c) => c.getLicenseAudit(),
  listTenants: (c) => c.listTenants(),
  createTenant: (c) => c.createTenant({ name: "n" }),
  getTenantQuota: (c) => c.getTenantQuota(P.tenantID),
  updateTenantQuota: (c) => c.updateTenantQuota(P.tenantID, {} as never),
  getTenant: (c) => c.getTenant(P.tenantID),
  deleteTenant: (c) => c.deleteTenant(P.tenantID),
  listIndexes: (c) => c.listIndexes(),
  createIndex: (c) => c.createIndex({ name: "n" }),
  getIndex: (c) => c.getIndex(P.indexID),
  deleteIndex: (c) => c.deleteIndex(P.indexID),
  updateIndex: (c) => c.updateIndex(P.indexID, {}),
  getIndexStatus: (c) => c.getIndexStatus(P.indexID),
  listDocumentsByPrefix: (c) => c.listDocuments({ indexId: P.indexID }).all(),
  addDocuments: (c) => c.addDocuments(P.indexID, []),
  bulkDeleteDocuments: (c) => c.bulkDeleteDocuments(P.indexID, [1]),
  bulkDeleteByExternalIDs: (c) => c.bulkDeleteByExternalIds(P.indexID, ["e"]),
  upsertResource: (c) => c.upsertResource(P.indexID, P.resourceID, {} as never),
  getDocument: (c) => c.getDocument(P.indexID, P.docID),
  deleteDocument: (c) => c.deleteDocument(P.indexID, P.docID),
  getChunk: (c) => c.getChunk(P.indexID, P.chunkID),
  deleteChunk: (c) => c.deleteChunks(P.indexID, [1]),
  search: (c) => c.search({ indexId: P.indexID, query: "q" }),
  batchSearch: (c) => c.batchSearch(P.indexID, [{ query: "q" }]),
  compactIndex: (c) => c.compactIndex(P.indexID),
  compactAllIndexes: (c) => c.compactAllIndexes(),
  clearIndex: (c) => c.clearIndex(P.indexID),
  getLiveIndexStats: (c) => c.getLiveStats(P.indexID),
  flushIndex: (c) => c.flushIndex(P.indexID),
  rebuildIndexGraph: (c) => c.rebuildGraph(P.indexID),
  importDocuments: (c) => c.importDocuments(P.indexID, []),
  getPendingStatus: (c) => c.getPendingStatus(P.indexID),
  clearPending: (c) => c.clearPending(P.indexID),
  processPending: (c) => c.processPending(P.indexID),
  syncDocuments: (c) =>
    c.syncDocuments({
      orgId: P.orgID,
      user_id: P.userID,
      source_type: "s",
      documents: [],
    } as never),
  searchMultiIndex: (c) => c.multiSearch({ orgId: P.orgID, userId: P.userID, query: "q" }),
  listUserIndexes: (c) => c.listUserIndexes(P.orgID, P.userID),
  listSharedIndexes: (c) => c.listSharedIndexes(P.orgID),
  switchEmbeddingModel: (c) =>
    c.switchEmbeddingModel({
      indexId: P.indexID,
      embedding_backend: "ollama",
      model: "m",
      dimension: 4,
    } as never),
  listAllJobs: (c) => c.listJobs({ scope: "all" }),
  getJob: (c) => c.getJob(P.jobID),
  listTenantJobs: (c) => c.listJobs({ scope: "tenant" }),
  runIndexGC: (c) => c.runIndexGC(P.tenantID, P.indexID),
  runGlobalGC: (c) => c.runAdminGC(),
  cleanupOrphans: (c) => c.cleanupOrphans(),
  getEmbedSpaceAdmin: (c) => c.getEmbedSpaceAdmin(),
  getAPIKeyStatus: (c) => c.getAPIKeyStatus(),
  listAllBackups: (c) => c.listAllBackups(),
  getBackupStatus: (c) => c.getBackupStatus(),
  listClusterNodes: (c) => c.getClusterNodes(),
  listClusterShards: (c) => c.getClusterShards(),
  clusterHealth: (c) => c.getClusterHealth(),
  createBackup: (c) => c.createBackup(P.indexID),
  listBackups: (c) => c.listBackups(),
  restoreBackup: (c) => c.restoreBackup(P.backupID, "dest"),
  deleteBackup: (c) => c.deleteBackup(P.backupID),
  createAPIKey: (c) => c.createAPIKey({} as never),
  listAPIKeys: (c) => c.listAPIKeys(),
  revokeAPIKey: (c) => c.revokeAPIKey(P.keyID),
  getLLMSettings: (c) => c.getLLMSettings(P.orgID),
  updateLLMSettings: (c) => c.updateLLMSettings(P.orgID, {}),
  deleteLLMSettings: (c) => c.deleteLLMSettings(P.orgID),
};

function expandTemplate(template: string): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = (P as Record<string, string>)[name];
    if (v === undefined) throw new Error(`no test value for path param {${name}} in ${template}`);
    return v;
  });
}

describe("spec operation coverage", () => {
  const ops = loadSpecOps();

  it("parses the vendored spec", () => {
    expect(ops.length).toBeGreaterThan(0);
  });

  it("has exactly one SDK call per spec operationId", () => {
    const specIds = ops.map((o) => o.operationId).sort();
    expect(new Set(specIds).size).toBe(specIds.length);
    const missing = specIds.filter((id) => !(id in CALLS));
    const stale = Object.keys(CALLS).filter((id) => !specIds.includes(id));
    expect({ missing, stale }).toEqual({ missing: [], stale: [] });
  });

  for (const op of ops) {
    it(`${op.operationId}: ${op.method} ${op.template}`, async () => {
      const call = CALLS[op.operationId];
      if (!call) throw new Error(`spec operation ${op.operationId} has no SDK call`);
      const log: Recorded[] = [];
      await call(recordingClient(log));
      expect(log.length).toBeGreaterThanOrEqual(1);
      expect(log[0]).toEqual({ method: op.method, path: expandTemplate(op.template) });
    });
  }
});
