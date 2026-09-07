/**
 * Quickstart: end-to-end flow against a local GraphANN server.
 *
 * Steps:
 *   1. Health probe
 *   2. Create a tenant (idempotent by ID)
 *   3. Create an index
 *   4. Mint an API key (forward-looking — current dev server is permissive)
 *   5. Ingest 10 small documents
 *   6. Run a text search
 *   7. Switch the embedding model
 *   8. Re-search after the swap
 *
 * Run with:
 *   GRAPHANN_BASE_URL=http://localhost:38888 npx tsx examples/quickstart.ts
 */

import { Client, RateLimitError, GraphANNError } from "../src/index.js";

const baseUrl = process.env["GRAPHANN_BASE_URL"] ?? "http://localhost:38888";
const apiKey = process.env["GRAPHANN_API_KEY"] ?? "";

async function main(): Promise<void> {
  const client = new Client({
    baseUrl,
    apiKey,
    timeout: 30_000,
    maxRetries: 3,
    metricsHook: (name, value, labels) => {
      if (name === "request.end") {
        console.log(`[metric] ${name} ${value}ms ${JSON.stringify(labels)}`);
      }
    },
  });

  // 1. Health
  const health = await client.health();
  console.log(`Server: ${health.status}`);

  // 2. Create tenant (idempotent via explicit ID).
  const tenantId = "t_quickstart";
  const tenant = await client.createTenant({ id: tenantId, name: "Quickstart" });
  console.log(`Tenant: ${tenant.id}`);

  // 3. Create index.
  const index = await client.createIndex(
    { id: "i_quickstart", name: "demo", description: "Quickstart index" },
    { tenantId: tenant.id },
  );
  console.log(`Index: ${index.id}`);

  // 4. Mint an API key. The plaintext secret is returned ONCE on creation
  //    and is never re-readable, so capture it here.
  try {
    const key = await client.createAPIKey(
      { name: "quickstart", user_id: "u_quickstart" },
      { tenantId: tenant.id },
    );
    console.log(`API key id=${key.id} plaintext=${key.plaintext}`);
  } catch (err) {
    if (err instanceof GraphANNError) {
      console.warn(`createAPIKey failed: ${err.message}`);
    } else {
      throw err;
    }
  }

  // 5. Upsert a resource (atomic create-or-replace by resource ID).
  const indexId = index.id;
  if (!indexId) throw new Error("createIndex did not return an id");
  const upserted = await client.upsertResource(
    indexId,
    "resource-quickstart",
    { text: "GraphANN stores graph topology, not embeddings.", metadata: { src: "quickstart" } },
    { tenantId: tenant.id },
  );
  console.log(
    `Resource ${upserted.resource_id}: op=${upserted.operation} ` +
      `added=${upserted.chunks_added} tombstoned=${upserted.chunks_tombstoned}`,
  );

  // 7. Ingest 10 documents.
  const docs = Array.from({ length: 10 }, (_, i) => ({
    id: `doc-${i}`,
    text: `Document ${i}: vector databases recompute embeddings on demand to save storage.`,
  }));
  const ingest = await client.addDocuments(indexId, docs, { tenantId: tenant.id });
  console.log(`Ingested ${ingest.added} chunks (ids ${(ingest.chunk_ids ?? []).join(",")})`);

  // 8. Search.
  const r1 = await client.search(
    { indexId, query: "vector database storage savings", k: 5 },
    { tenantId: tenant.id },
  );
  console.log(`Top results before swap:`);
  for (const hit of r1.results ?? []) {
    console.log(`  ${hit.id} score=${(hit.score ?? 0).toFixed(4)}`);
  }

  // 9. Switch the embedding model. This is async — poll the job until done.
  try {
    const job = await client.switchEmbeddingModel(
      {
        indexId,
        embedding_backend: "ollama",
        model: "nomic-embed-text",
        dimension: 768,
      },
      { tenantId: tenant.id },
    );
    const jobId = job.job_id;
    if (!jobId) throw new Error("switchEmbeddingModel did not return a job_id");
    console.log(`Reembed job queued: ${jobId}`);

    // Poll up to 30s.
    for (let i = 0; i < 30; i++) {
      const status = await client.getJob(jobId);
      console.log(
        `  job ${status.status} progress=${status.progress?.chunks_done ?? 0}/${status.progress?.chunks_total ?? 0}`,
      );
      if (status.status === "completed" || status.status === "failed") break;
      await new Promise((r) => setTimeout(r, 1_000));
    }
  } catch (err) {
    if (err instanceof RateLimitError) {
      console.warn(`rate limited; retry after ${err.retryAfter ?? "?"}ms`);
    } else if (err instanceof GraphANNError) {
      console.warn(`switch failed: ${err.message}`);
    } else {
      throw err;
    }
  }

  // 10. Re-search after the swap.
  const r2 = await client.search(
    { indexId, query: "vector database storage savings", k: 5 },
    { tenantId: tenant.id },
  );
  console.log(`Top results after swap:`);
  for (const hit of r2.results ?? []) {
    console.log(`  ${hit.id} score=${(hit.score ?? 0).toFixed(4)}`);
  }
}

main().catch((err: unknown) => {
  console.error("quickstart failed:", err);
  process.exitCode = 1;
});
