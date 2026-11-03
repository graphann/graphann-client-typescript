import { describe, expect, it } from "vitest";

import { Client } from "../src/client.js";
import type { BatchSearchResult, RelatedHop, SearchResponse } from "../src/types.js";

interface Captured {
  url: string;
  body: Record<string, unknown>;
  headers: Headers;
}

function clientReturning(
  payload: unknown,
  captured: Captured[],
  extra: Partial<ConstructorParameters<typeof Client>[0]> = {},
): Client {
  const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    captured.push({
      url,
      body:
        typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {},
      headers: new Headers(init?.headers),
    });
    return Promise.resolve(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof fetch;
  return new Client({
    baseUrl: "http://graphann.test",
    tenantId: "t1",
    maxRetries: 0,
    fetch: fetchImpl,
    ...extra,
  });
}

describe("related search", () => {
  it("sends the five related fields and allows no query/vector", async () => {
    const cap: Captured[] = [];
    const c = clientReturning({ results: [], total: 0 }, cap);
    await c.search({
      indexId: "i1",
      related_to: "doc-1",
      hops: 2,
      fanout: 10,
      novel_only: true,
      diversity: 0.5,
    });
    expect(cap[0]?.url).toBe("http://graphann.test/v1/tenants/t1/indexes/i1/search");
    expect(cap[0]?.body).toEqual({
      related_to: "doc-1",
      hops: 2,
      fanout: 10,
      novel_only: true,
      diversity: 0.5,
    });
  });

  it("omits related fields when unset", async () => {
    const cap: Captured[] = [];
    const c = clientReturning({ results: [], total: 0 }, cap);
    await c.search({ indexId: "i1", query: "q" });
    expect(cap[0]?.body).toEqual({ query: "q" });
  });

  it("still rejects search with no query, vector or related_to", async () => {
    const c = clientReturning({}, []);
    await expect(c.search({ indexId: "i1" })).rejects.toThrow(/related_to/);
  });

  it("parses path, support, direct_score, exhaustive and shards_probed", async () => {
    const hops: RelatedHop[] = [
      { id: "a", score: 0.9 },
      { id: "b", score: 0.8 },
    ];
    const payload: SearchResponse = {
      results: [{ id: "b", score: 0.72, path: hops, support: 3, direct_score: 0.4 }],
      total: 1,
      exhaustive: true,
      shards_probed: 2,
    };
    const c = clientReturning(payload, []);
    const resp = await c.search({ indexId: "i1", related_to: "x", hops: 2 });
    const r = resp.results?.[0];
    expect(r?.path).toEqual(hops);
    expect(r?.support).toBe(3);
    expect(r?.direct_score).toBe(0.4);
    expect(resp.exhaustive).toBe(true);
    expect(resp.shards_probed).toBe(2);
  });

  it("batchSearch forwards group_by, max_per_doc and related_to per query", async () => {
    const cap: Captured[] = [];
    const item: BatchSearchResult = {
      results: [],
      total: 0,
      exhaustive: false,
    };
    const c = clientReturning({ responses: [item, item] }, cap);
    const queries: Parameters<Client["batchSearch"]>[1] = [
      { query: "q", group_by: "document", max_per_doc: 2 },
      { related_to: "doc-1", hops: 3, fanout: 5 },
    ];
    const resp = await c.batchSearch("i1", queries);
    expect(cap[0]?.body).toEqual({ queries });
    expect(resp.responses?.[0]?.exhaustive).toBe(false);
  });
});

describe("node admin token", () => {
  it("sends X-GraphANN-Admin-Token when configured", async () => {
    const cap: Captured[] = [];
    const c = clientReturning({}, cap, { nodeAdminToken: "tok" });
    await c.getClusterNodes();
    expect(cap[0]?.headers.get("x-graphann-admin-token")).toBe("tok");
  });

  it("omits the header by default", async () => {
    const cap: Captured[] = [];
    await clientReturning({}, cap).getClusterNodes();
    expect(cap[0]?.headers.has("x-graphann-admin-token")).toBe(false);
  });
});
