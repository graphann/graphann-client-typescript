/**
 * End-to-end client tests using msw to mock the GraphANN HTTP API.
 *
 * Covers: success path, error mapping for every HTTP status the SDK knows
 * about, retry-after honoring, gzip thresholds, header propagation,
 * cancellation via AbortSignal, and cache + singleflight coalescing.
 */

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Client } from "../src/client.js";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  GraphANNError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitError,
  ServerError,
  ValidationError,
} from "../src/errors.js";
import { SDK_VERSION } from "../src/options.js";

const BASE = "http://graphann.test";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function newClient(overrides: Partial<ConstructorParameters<typeof Client>[0]> = {}): Client {
  return new Client({
    baseUrl: BASE,
    apiKey: "ak_test",
    tenantId: "t_default",
    timeout: 5_000,
    maxRetries: 0,
    initialBackoff: 5,
    ...overrides,
  });
}

describe("Client.health", () => {
  it("returns 200 success", async () => {
    server.use(
      http.get(`${BASE}/health`, () =>
        HttpResponse.json({ status: "healthy" }),
      ),
    );
    const client = newClient();
    expect(await client.health()).toEqual({ status: "healthy" });
  });

  it("forwards X-API-Key and User-Agent", async () => {
    let captured: Headers | null = null;
    server.use(
      http.get(`${BASE}/health`, ({ request }) => {
        captured = request.headers;
        return HttpResponse.json({ status: "healthy" });
      }),
    );
    const client = newClient();
    await client.health();
    expect(captured).not.toBeNull();
    expect(captured!.get("x-api-key")).toBe("ak_test");
    expect(captured!.get("user-agent")).toContain(`graphann-typescript/${SDK_VERSION}`);
    expect(captured!.get("x-tenant-id")).toBe("t_default");
  });
});

describe("Client error mapping", () => {
  it("maps 400 to ValidationError", async () => {
    server.use(
      http.post(`${BASE}/v1/tenants`, () =>
        HttpResponse.json(
          { error: { code: "validation_error", message: "name required" } },
          { status: 400 },
        ),
      ),
    );
    await expect(newClient().createTenant({ name: "" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("maps 401 to AuthenticationError", async () => {
    server.use(
      http.get(`${BASE}/v1/tenants`, () =>
        HttpResponse.json(
          { error: { code: "unauthorized", message: "Authentication required" } },
          { status: 401 },
        ),
      ),
    );
    await expect(newClient().listTenants()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("maps 403 to AuthorizationError", async () => {
    server.use(
      http.get(`${BASE}/v1/tenants`, () =>
        HttpResponse.json(
          { error: { code: "forbidden", message: "Access denied" } },
          { status: 403 },
        ),
      ),
    );
    await expect(newClient().listTenants()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("maps 404 to NotFoundError", async () => {
    server.use(
      http.get(`${BASE}/v1/tenants/t_missing`, () =>
        HttpResponse.json({ error: { code: "not_found", message: "Tenant not found" } }, { status: 404 }),
      ),
    );
    await expect(newClient().getTenant("t_missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("maps 409 to ConflictError", async () => {
    server.use(
      http.patch(`${BASE}/v1/tenants/t_default/indexes/i_x/embedding-model`, () =>
        HttpResponse.json(
          { error: { code: "conflict", message: "in flight" } },
          { status: 409 },
        ),
      ),
    );
    await expect(
      newClient().switchEmbeddingModel({
        indexId: "i_x",
        embedding_backend: "ollama",
        model: "m",
        dimension: 768,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("maps 413 to PayloadTooLargeError", async () => {
    server.use(
      http.post(`${BASE}/v1/tenants/t_default/indexes/i_x/documents`, () =>
        HttpResponse.json({ error: { code: "payload_too_large", message: "too big" } }, { status: 413 }),
      ),
    );
    await expect(
      newClient().addDocuments("i_x", [{ text: "hi" }]),
    ).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it("maps 429 to RateLimitError with parsed Retry-After", async () => {
    server.use(
      http.get(`${BASE}/v1/tenants`, () =>
        HttpResponse.json(
          { error: { code: "rate_limited", message: "slow down" } },
          { status: 429, headers: { "Retry-After": "7" } },
        ),
      ),
    );
    try {
      await newClient().listTenants();
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfter).toBe(7_000);
    }
  });

  it("maps 5xx to ServerError preserving status", async () => {
    server.use(
      http.get(`${BASE}/v1/tenants`, () =>
        HttpResponse.json(
          { error: { code: "internal_error", message: "boom" } },
          { status: 502 },
        ),
      ),
    );
    try {
      await newClient().listTenants();
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ServerError);
      expect((err as ServerError).status).toBe(502);
    }
  });

  it("base GraphANNError class is the parent", async () => {
    server.use(
      http.get(`${BASE}/v1/tenants`, () =>
        HttpResponse.json({ error: { code: "internal_error", message: "boom" } }, { status: 500 }),
      ),
    );
    await expect(newClient().listTenants()).rejects.toBeInstanceOf(GraphANNError);
  });
});

describe("Retry behaviour", () => {
  it("retries on 503 then succeeds", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/health`, () => {
        calls++;
        if (calls < 2) {
          return HttpResponse.json(
            { error: { code: "internal_error", message: "warming up" } },
            { status: 503 },
          );
        }
        return HttpResponse.json({ status: "healthy" });
      }),
    );
    const client = newClient({ maxRetries: 3, initialBackoff: 5 });
    expect(await client.health()).toEqual({ status: "healthy" });
    expect(calls).toBe(2);
  });

  it("honors Retry-After on 429 then succeeds", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/health`, () => {
        calls++;
        if (calls < 2) {
          return HttpResponse.json(
            { error: { code: "rate_limited", message: "slow" } },
            { status: 429, headers: { "Retry-After": "0" } },
          );
        }
        return HttpResponse.json({ status: "healthy" });
      }),
    );
    const client = newClient({ maxRetries: 2, initialBackoff: 5 });
    expect(await client.health()).toEqual({ status: "healthy" });
    expect(calls).toBe(2);
  });

  it("does NOT retry on 400", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/v1/tenants`, () => {
        calls++;
        return HttpResponse.json(
          { error: { code: "bad_request", message: "no" } },
          { status: 400 },
        );
      }),
    );
    await expect(newClient({ maxRetries: 5 }).listTenants()).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(calls).toBe(1);
  });

  it("gives up after maxRetries", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/health`, () => {
        calls++;
        return HttpResponse.json(
          { error: { code: "internal_error", message: "down" } },
          { status: 503 },
        );
      }),
    );
    await expect(
      newClient({ maxRetries: 2, initialBackoff: 1 }).health(),
    ).rejects.toBeInstanceOf(ServerError);
    expect(calls).toBe(3); // initial + 2 retries
  });
});

describe("AbortSignal", () => {
  it("cancels mid-request", async () => {
    server.use(
      http.get(`${BASE}/health`, async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({ status: "healthy" });
      }),
    );
    const ctrl = new AbortController();
    const promise = newClient().health({ signal: ctrl.signal });
    setTimeout(() => ctrl.abort(new Error("user cancel")), 5);
    await expect(promise).rejects.toThrow();
  });
});

describe("Cache and singleflight", () => {
  it("collapses concurrent identical reads (singleflight)", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/v1/tenants`, async () => {
        calls++;
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json({ tenants: [], total: 0 });
      }),
    );
    const client = newClient({ singleflight: true });
    const [a, b, c] = await Promise.all([
      client.listTenants(),
      client.listTenants(),
      client.listTenants(),
    ]);
    expect(calls).toBe(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("does NOT cache when cache:false (default)", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/v1/tenants`, () => {
        calls++;
        return HttpResponse.json({ tenants: [], total: calls });
      }),
    );
    const client = newClient({ singleflight: false });
    await client.listTenants();
    await client.listTenants();
    expect(calls).toBe(2);
  });

  it("caches reads when cache:true", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/v1/tenants`, () => {
        calls++;
        return HttpResponse.json({ tenants: [], total: calls });
      }),
    );
    const client = newClient({ cache: true, cacheTTL: 60_000, singleflight: false });
    const a = await client.listTenants();
    const b = await client.listTenants();
    expect(calls).toBe(1);
    expect(a).toEqual(b);
  });

  it("bypassCache forces a fresh request", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/v1/tenants`, () => {
        calls++;
        return HttpResponse.json({ tenants: [], total: calls });
      }),
    );
    const client = newClient({ cache: true, cacheTTL: 60_000, singleflight: false });
    await client.listTenants();
    await client.listTenants({ bypassCache: true });
    expect(calls).toBe(2);
  });
});

describe("Tenant override", () => {
  it("uses per-call tenantId in URL", async () => {
    let path = "";
    server.use(
      http.get(`${BASE}/v1/tenants/t_override/indexes`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ indexes: [], total: 0 });
      }),
    );
    await newClient().listIndexes({ tenantId: "t_override" });
    expect(path).toBe("/v1/tenants/t_override/indexes");
  });

  it("requires tenantId when none configured", async () => {
    const client = new Client({ baseUrl: BASE, apiKey: "ak_test" });
    await expect(client.listIndexes()).rejects.toThrow(/tenantId is required/);
  });
});

describe("Search request building", () => {
  it("rejects search() with neither query nor vector", async () => {
    await expect(newClient().search({ indexId: "i_x" })).rejects.toThrow(
      /query.*vector/i,
    );
  });

  it("sends `query` for text search", async () => {
    let captured: unknown = null;
    server.use(
      http.post(`${BASE}/v1/tenants/t_default/indexes/i_x/search`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ results: [], total: 0 });
      }),
    );
    await newClient().search({ indexId: "i_x", query: "hello", k: 7 });
    expect(captured).toEqual({ query: "hello", k: 7 });
  });

  it("sends `vector` for vector search via search()", async () => {
    let captured: unknown = null;
    server.use(
      http.post(`${BASE}/v1/tenants/t_default/indexes/i_x/search`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ results: [], total: 0 });
      }),
    );
    await newClient().search({ indexId: "i_x", vector: [0.1, 0.2], k: 5 });
    expect(captured).toEqual({ vector: [0.1, 0.2], k: 5 });
  });

  it("sends filter.equals in search body", async () => {
    let captured: unknown = null;
    server.use(
      http.post(`${BASE}/v1/tenants/t_default/indexes/i_x/search`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ results: [], total: 0 });
      }),
    );
    await newClient().search({
      indexId: "i_x",
      query: "hi",
      filter: { equals: { lang: "en", env: "prod" } },
    });
    expect((captured as { filter: { equals: Record<string, string> } }).filter.equals).toEqual({
      lang: "en",
      env: "prod",
    });
  });
});

describe("upsertResource", () => {
  it("sends PUT with text and metadata", async () => {
    let captured: unknown = null;
    let capturedMethod = "";
    server.use(
      http.put(
        `${BASE}/v1/tenants/t_default/indexes/i_x/resources/doc-1`,
        async ({ request }) => {
          capturedMethod = request.method;
          captured = await request.json();
          return HttpResponse.json({
            resource_id: "doc-1",
            chunks_added: 3,
            chunks_tombstoned: 0,
            operation: "create",
          });
        },
      ),
    );
    const resp = await newClient().upsertResource("i_x", "doc-1", {
      text: "hello world",
      metadata: { src: "test" },
    });
    expect(capturedMethod).toBe("PUT");
    expect(captured).toEqual({ text: "hello world", metadata: { src: "test" } });
    expect(resp.resource_id).toBe("doc-1");
    expect(resp.chunks_added).toBe(3);
    expect(resp.operation).toBe("create");
  });

  it("returns update operation on second call", async () => {
    server.use(
      http.put(
        `${BASE}/v1/tenants/t_default/indexes/i_x/resources/doc-1`,
        () =>
          HttpResponse.json({
            resource_id: "doc-1",
            chunks_added: 2,
            chunks_tombstoned: 3,
            operation: "update",
          }),
      ),
    );
    const resp = await newClient().upsertResource("i_x", "doc-1", { text: "updated" });
    expect(resp.operation).toBe("update");
    expect(resp.chunks_tombstoned).toBe(3);
  });
});

describe("createIndex with compression and approximate", () => {
  it("sends compression and approximate fields", async () => {
    let captured: unknown = null;
    server.use(
      http.post(`${BASE}/v1/tenants/t_default/indexes`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(
          {
            id: "i_new",
            tenant_id: "t_default",
            name: "demo",
            status: "empty",
            num_docs: 0,
            num_chunks: 0,
            dimension: 0,
            created_at: "2026-04-28T00:00:00Z",
            updated_at: "2026-04-28T00:00:00Z",
            compression: "pq",
            approximate: true,
          },
          { status: 201 },
        );
      }),
    );
    const idx = await newClient().createIndex({
      name: "demo",
      compression: "pq",
      approximate: true,
    });
    expect(captured).toEqual({ name: "demo", compression: "pq", approximate: true });
    expect(idx.compression).toBe("pq");
    expect(idx.approximate).toBe(true);
  });
});

describe("Document operations", () => {
  it("addDocuments wraps the array in `documents`", async () => {
    let captured: unknown = null;
    server.use(
      http.post(
        `${BASE}/v1/tenants/t_default/indexes/i_x/documents`,
        async ({ request }) => {
          captured = await request.json();
          return HttpResponse.json(
            { added: 2, index_id: "i_x", chunk_ids: ["chunk-0", "chunk-1"] },
            { status: 201 },
          );
        },
      ),
    );
    const docs = [{ text: "a" }, { text: "b" }];
    const r = await newClient().addDocuments("i_x", docs);
    expect(captured).toEqual({ documents: docs });
    expect(r.added).toBe(2);
  });

  it("bulkDeleteDocuments sends DELETE with body", async () => {
    let body: unknown = null;
    server.use(
      http.delete(
        `${BASE}/v1/tenants/t_default/indexes/i_x/documents`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            index_id: "i_x",
            documents_deleted: 2,
            chunks_deleted: 5,
            deleted_per_doc: { "1": 3, "2": 2 },
          });
        },
      ),
    );
    await newClient().bulkDeleteDocuments("i_x", [1, 2]);
    expect(body).toEqual({ document_ids: [1, 2] });
  });

  it("bulkDeleteByExternalIds posts to /documents/by-external-id", async () => {
    let url = "";
    let body: unknown = null;
    server.use(
      http.delete(
        `${BASE}/v1/tenants/t_default/indexes/i_x/documents/by-external-id`,
        async ({ request }) => {
          url = new URL(request.url).pathname;
          body = await request.json();
          return HttpResponse.json({
            index_id: "i_x",
            documents_deleted: 1,
            chunks_deleted: 1,
            deleted_per_id: { "ext-1": 1 },
          });
        },
      ),
    );
    await newClient().bulkDeleteByExternalIds("i_x", ["ext-1"]);
    expect(url).toBe("/v1/tenants/t_default/indexes/i_x/documents/by-external-id");
    expect(body).toEqual({ external_ids: ["ext-1"] });
  });

  it("listDocuments yields async pages", async () => {
    server.use(
      http.get(
        `${BASE}/v1/tenants/t_default/indexes/i_x/documents`,
        ({ request }) => {
          const url = new URL(request.url);
          const cursor = url.searchParams.get("cursor");
          if (!cursor) {
            return HttpResponse.json({
              documents: [{ id: "a" }, { id: "b" }],
              next_cursor: "c2",
            });
          }
          if (cursor === "c2") {
            return HttpResponse.json({
              documents: [{ id: "c" }],
              next_cursor: "",
            });
          }
          return HttpResponse.json({ documents: [], next_cursor: "" });
        },
      ),
    );

    const collected: string[] = [];
    for await (const page of newClient().listDocuments({ indexId: "i_x" })) {
      for (const d of page.items) collected.push(d.id);
    }
    expect(collected).toEqual(["a", "b", "c"]);
  });
});

describe("Cluster + jobs", () => {
  it("getClusterHealth GETs /v1/cluster/health", async () => {
    server.use(
      http.get(`${BASE}/v1/cluster/health`, () =>
        HttpResponse.json({
          status: "ok",
          cluster_size: 0,
          alive_nodes: 0,
          raft_has_leader: false,
        }),
      ),
    );
    const r = await newClient().getClusterHealth();
    expect(r.status).toBe("ok");
  });

  it("listJobs scope:'all' hits /v1/jobs", async () => {
    let path = "";
    server.use(
      http.get(`${BASE}/v1/jobs`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ jobs: [], total: 0 });
      }),
    );
    await newClient().listJobs({ scope: "all" });
    expect(path).toBe("/v1/jobs");
  });

  it("listJobs default scope hits tenant-scoped path", async () => {
    let path = "";
    server.use(
      http.get(`${BASE}/v1/tenants/t_default/jobs`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ jobs: [], total: 0 });
      }),
    );
    await newClient().listJobs();
    expect(path).toBe("/v1/tenants/t_default/jobs");
  });
});

describe("Metrics hook", () => {
  it("fires lifecycle events", async () => {
    server.use(
      http.get(`${BASE}/health`, () => HttpResponse.json({ status: "healthy" })),
    );
    const spy = vi.fn();
    const client = newClient({ metricsHook: spy });
    await client.health();
    const names = spy.mock.calls.map((c) => c[0] as string);
    expect(names).toContain("request.start");
    expect(names).toContain("request.end");
  });
});

describe("Gzip threshold", () => {
  it("compresses bodies above the threshold", async () => {
    let encoding: string | null = null;
    let length = 0;
    server.use(
      http.post(
        `${BASE}/v1/tenants/t_default/indexes/i_x/documents`,
        async ({ request }) => {
          encoding = request.headers.get("content-encoding");
          const buf = await request.arrayBuffer();
          length = buf.byteLength;
          return HttpResponse.json(
            { added: 1, index_id: "i_x", chunk_ids: ["chunk-0"] },
            { status: 201 },
          );
        },
      ),
    );
    const big = "x".repeat(70_000);
    await newClient({ gzipThreshold: 1_024 }).addDocuments("i_x", [{ text: big }]);
    expect(encoding).toBe("gzip");
    expect(length).toBeLessThan(70_000); // gzip should compress repeated x's significantly
  });

  it("skips gzip when below the threshold", async () => {
    let encoding: string | null = null;
    server.use(
      http.post(
        `${BASE}/v1/tenants/t_default/indexes/i_x/documents`,
        ({ request }) => {
          encoding = request.headers.get("content-encoding");
          return HttpResponse.json(
            { added: 1, index_id: "i_x", chunk_ids: ["chunk-0"] },
            { status: 201 },
          );
        },
      ),
    );
    await newClient({ gzipThreshold: 1024 * 1024 }).addDocuments("i_x", [{ text: "small" }]);
    expect(encoding).toBeNull();
  });
});

describe("204 No Content", () => {
  it("returns undefined for deleteIndex", async () => {
    server.use(
      http.delete(
        `${BASE}/v1/tenants/t_default/indexes/i_x`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const r = await newClient().deleteIndex("i_x");
    expect(r).toBeUndefined();
  });
});

describe("ready()", () => {
  it("GETs /ready and returns the parsed body", async () => {
    server.use(
      http.get(`${BASE}/ready`, () => HttpResponse.json({ status: "ready" })),
    );
    const r = await newClient().ready();
    expect(r).toEqual({ status: "ready" });
  });
});

describe("Chunk operations", () => {
  it("getChunk GETs /chunks/{id} and returns the chunk shape", async () => {
    server.use(
      http.get(
        `${BASE}/v1/tenants/t_default/indexes/i_x/chunks/42`,
        () =>
          HttpResponse.json({
            chunk_id: 42,
            text: "hello",
            document_id: 7,
            chunk_index: 0,
            start: 0,
            end: 5,
          }),
      ),
    );
    const r = await newClient().getChunk("i_x", 42);
    expect(r.chunk_id).toBe(42);
    expect(r.text).toBe("hello");
    expect(r.document_id).toBe(7);
  });

  it("deleteChunks DELETEs /chunks/0 with chunk_ids body", async () => {
    let body: unknown = null;
    server.use(
      http.delete(
        `${BASE}/v1/tenants/t_default/indexes/i_x/chunks/0`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ deleted: 2, index_id: "i_x" });
        },
      ),
    );
    const r = await newClient().deleteChunks("i_x", [9, 10]);
    expect(body).toEqual({ chunk_ids: [9, 10] });
    expect(r.deleted).toBe(2);
  });
});

describe("Pending queue", () => {
  it("getPendingStatus GETs /pending", async () => {
    server.use(
      http.get(
        `${BASE}/v1/tenants/t_default/indexes/i_x/pending`,
        () => HttpResponse.json({ index_id: "i_x", pending_count: 3 }),
      ),
    );
    const r = await newClient().getPendingStatus("i_x");
    expect(r.pending_count).toBe(3);
  });

  it("processPending POSTs /process", async () => {
    server.use(
      http.post(
        `${BASE}/v1/tenants/t_default/indexes/i_x/process`,
        () =>
          HttpResponse.json({
            index_id: "i_x",
            processed: 2,
            chunks_created: 4,
            chunk_ids: ["c-10", "c-11", "c-12", "c-13"],
          }),
      ),
    );
    const r = await newClient().processPending("i_x");
    expect(r.processed).toBe(2);
    expect(r.chunks_created).toBe(4);
    expect(r.chunk_ids).toEqual(["c-10", "c-11", "c-12", "c-13"]);
  });

  it("clearPending DELETEs /pending", async () => {
    server.use(
      http.delete(
        `${BASE}/v1/tenants/t_default/indexes/i_x/pending`,
        () =>
          HttpResponse.json({
            index_id: "i_x",
            status: "cleared",
            message: "Pending documents cleared",
          }),
      ),
    );
    const r = await newClient().clearPending("i_x");
    expect(r.status).toBe("cleared");
  });
});

describe("Org index listings", () => {
  it("listSharedIndexes GETs /v1/orgs/{org}/shared/indexes", async () => {
    let path = "";
    server.use(
      http.get(`${BASE}/v1/orgs/org_a/shared/indexes`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ indexes: [], total: 0, org_id: "org_a" });
      }),
    );
    const r = await newClient().listSharedIndexes("org_a");
    expect(path).toBe("/v1/orgs/org_a/shared/indexes");
    expect(r.org_id).toBe("org_a");
  });

  it("listUserIndexes GETs /v1/orgs/{org}/users/{user}/indexes", async () => {
    let path = "";
    server.use(
      http.get(
        `${BASE}/v1/orgs/org_a/users/u_1/indexes`,
        ({ request }) => {
          path = new URL(request.url).pathname;
          return HttpResponse.json({
            indexes: [],
            total: 0,
            org_id: "org_a",
            user_id: "u_1",
          });
        },
      ),
    );
    const r = await newClient().listUserIndexes("org_a", "u_1");
    expect(path).toBe("/v1/orgs/org_a/users/u_1/indexes");
    expect(r.user_id).toBe("u_1");
  });
});

describe("LLM settings (org-scoped)", () => {
  it("getLLMSettings GETs /v1/orgs/{org}/llm-settings", async () => {
    let path = "";
    server.use(
      http.get(`${BASE}/v1/orgs/org_a/llm-settings`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ provider: "openai", model: "gpt-4o-mini" });
      }),
    );
    const r = await newClient().getLLMSettings("org_a");
    expect(path).toBe("/v1/orgs/org_a/llm-settings");
    expect(r.provider).toBe("openai");
  });

  it("updateLLMSettings PATCHes the new path with partial body", async () => {
    let method = "";
    let body: unknown = null;
    server.use(
      http.patch(
        `${BASE}/v1/orgs/org_a/llm-settings`,
        async ({ request }) => {
          method = request.method;
          body = await request.json();
          return HttpResponse.json({
            message: "updated",
            org_id: "org_a",
            settings: { provider: "openai", model: "gpt-4o-mini", temperature: 0.2 },
          });
        },
      ),
    );
    const r = await newClient().updateLLMSettings("org_a", { temperature: 0.2 });
    expect(method).toBe("PATCH");
    expect(body).toEqual({ temperature: 0.2 });
    expect(r.settings.temperature).toBe(0.2);
  });

  it("deleteLLMSettings DELETEs the new path", async () => {
    let path = "";
    server.use(
      http.delete(
        `${BASE}/v1/orgs/org_a/llm-settings`,
        ({ request }) => {
          path = new URL(request.url).pathname;
          return HttpResponse.json({ message: "reset", org_id: "org_a" });
        },
      ),
    );
    const r = await newClient().deleteLLMSettings("org_a");
    expect(path).toBe("/v1/orgs/org_a/llm-settings");
    expect(r.message).toBe("reset");
  });
});

describe("cleanupOrphans", () => {
  it("default call sends no query params and decodes the response", async () => {
    let url: URL | null = null;
    server.use(
      http.post(`${BASE}/v1/admin/cleanup-orphans`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({
          removed: ["/data/tenants/t/indexes/i.compact"],
          freed_bytes: 4096,
          min_age: "1h0m0s",
          dry_run: false,
        });
      }),
    );

    const resp = await newClient().cleanupOrphans();
    expect(url).not.toBeNull();
    expect(url!.searchParams.get("min_age")).toBeNull();
    expect(url!.searchParams.get("dry_run")).toBeNull();
    expect(resp.freed_bytes).toBe(4096);
    expect(resp.removed).toEqual(["/data/tenants/t/indexes/i.compact"]);
    expect(resp.min_age).toBe("1h0m0s");
    expect(resp.dry_run).toBe(false);
  });

  it("forwards minAge and dryRun as query params", async () => {
    let url: URL | null = null;
    server.use(
      http.post(`${BASE}/v1/admin/cleanup-orphans`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({
          removed: ["/data/tenants/t/indexes/i.pre-reembed.20260101T000000Z"],
          freed_bytes: 0,
          min_age: "24h0m0s",
          dry_run: true,
        });
      }),
    );

    const resp = await newClient().cleanupOrphans("24h", true);
    expect(url).not.toBeNull();
    expect(url!.searchParams.get("min_age")).toBe("24h");
    expect(url!.searchParams.get("dry_run")).toBe("true");
    expect(resp.dry_run).toBe(true);
    expect(resp.min_age).toBe("24h0m0s");
    expect(resp.removed).toHaveLength(1);
  });
});
