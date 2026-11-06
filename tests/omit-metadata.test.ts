import { describe, expect, it } from "vitest";

import { Client } from "../src/client.js";
import type { SearchFilter } from "../src/types.js";

async function sentBody(filter?: SearchFilter): Promise<Record<string, unknown>> {
  let body: Record<string, unknown> = {};
  const fetchImpl = ((_input: RequestInfo | URL, init?: RequestInit) => {
    body = JSON.parse(init?.body as string) as Record<string, unknown>;
    return Promise.resolve(
      new Response(JSON.stringify({ results: [], total: 0 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof fetch;
  const c = new Client({
    baseUrl: "http://graphann.test",
    tenantId: "t1",
    maxRetries: 0,
    fetch: fetchImpl,
  });
  await c.search({ indexId: "i1", query: "q", ...(filter ? { filter } : {}) });
  return body;
}

describe("filter.omit_metadata", () => {
  it("is sent when set", async () => {
    const body = await sentBody({ omit_metadata: true });
    expect((body.filter as Record<string, unknown>).omit_metadata).toBe(true);
  });

  it("is absent by default", async () => {
    const body = await sentBody();
    expect(JSON.stringify(body)).not.toContain("omit_metadata");
  });
});
