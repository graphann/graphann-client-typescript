/**
 * Integration test suite. Hits a real GraphANN server when both env vars are
 * present:
 *
 *   GRAPHANN_BASE_URL — base URL (no trailing slash)
 *   GRAPHANN_API_KEY  — API key (or empty for unauthenticated mode)
 *
 * Skipped on CI by default. Run locally with:
 *
 *   GRAPHANN_BASE_URL=http://localhost:38888 pnpm test integration
 */

import { describe, expect, it } from "vitest";
import { Client } from "../src/client.js";

const baseUrl = process.env["GRAPHANN_BASE_URL"];
const apiKey = process.env["GRAPHANN_API_KEY"] ?? "";

const describeOrSkip = baseUrl ? describe : describe.skip;

describeOrSkip("integration: live GraphANN server", () => {
  const newClient = (): Client =>
    new Client({
      baseUrl: baseUrl!,
      apiKey,
      timeout: 10_000,
      maxRetries: 1,
    });

  it("health responds", async () => {
    const client = newClient();
    const h = await client.health();
    expect(h.status).toBeTruthy();
  });

  it("createTenant/createIndex/addDocuments/search round-trip", async () => {
    const client = newClient();
    const tenantName = `sdk-test-${Date.now()}`;
    const tenant = await client.createTenant({ name: tenantName });
    expect(tenant.id).toMatch(/^t_/);
    const tenantId = tenant.id;
    if (!tenantId) throw new Error("createTenant did not return an id");

    const index = await client.createIndex({ name: "ts-sdk" }, { tenantId });
    expect(index.id).toMatch(/^i_/);
    const indexId = index.id;
    if (!indexId) throw new Error("createIndex did not return an id");

    const ingestDocs = Array.from({ length: 5 }, (_, i) => ({
      id: `doc-${i}`,
      text: `Document number ${i} talking about machine learning.`,
    }));
    const added = await client.addDocuments(indexId, ingestDocs, { tenantId });
    expect(added.added).toBe(5);

    // Give the server a moment to embed and index.
    await new Promise((r) => setTimeout(r, 1_000));

    const r = await client.search({ indexId, query: "machine learning", k: 3 }, { tenantId });
    expect(Array.isArray(r.results)).toBe(true);

    await client.deleteTenant(tenantId);
  }, 30_000);
});
