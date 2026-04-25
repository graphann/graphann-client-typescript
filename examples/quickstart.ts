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

  // 4. Mint an API key. Best-effort — the route may not yet exist on this
  //    server build; surface the failure but keep going.
  try {
    const key = await client.createAPIKey(
      { name: "quickstart", role: "Editor" },
      { tenantId: tenant.id },
    );
    console.log(`API key: ${key.secret ?? "(none)"} prefix=${key.prefix ?? "(none)"}`);
  } catch (err) {
    if (err instanceof GraphANNError) {
      console.warn(`createAPIKey not available on this server: ${err.message}`);
    } else {
      throw err;
    }
  }

  // 5. Ingest 10 documents.
  const docs = Array.from({ length: 10 }, (_, i) => ({
    id: `doc-${i}`,
    text: `Document ${i}: vector databases recompute embeddings on demand to save storage.`,
  }));
  const ingest = await client.addDocuments(index.id, docs, { tenantId: tenant.id });
  console.log(`Ingested ${ingest.added} chunks (ids ${ingest.chunk_ids.join(",")})`);

  // 6. Search.
  const r1 = await client.search(
    { indexId: index.id, query: "vector database storage savings", k: 5 },
    { tenantId: tenant.id },
  );
  console.log(`Top results before swap:`);
  for (const hit of r1.results) {
    console.log(`  ${hit.id} score=${hit.score.toFixed(4)}`);
  }

  // 7. Switch the embedding model. This is async — poll the job until done.
  try {
    const job = await client.switchEmbeddingModel(
      {
        indexId: index.id,
        embedding_backend: "ollama",
        model: "nomic-embed-text",
        dimension: 768,
      },
      { tenantId: tenant.id },
    );
    console.log(`Reembed job queued: ${job.job_id}`);

    // Poll up to 30s.
    for (let i = 0; i < 30; i++) {
      const status = await client.getJob(job.job_id);
      console.log(
        `  job ${status.status} progress=${status.progress.chunks_done}/${status.progress.chunks_total}`,
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

  // 8. Re-search after the swap.
  const r2 = await client.search(
    { indexId: index.id, query: "vector database storage savings", k: 5 },
    { tenantId: tenant.id },
  );
  console.log(`Top results after swap:`);
  for (const hit of r2.results) {
    console.log(`  ${hit.id} score=${hit.score.toFixed(4)}`);
  }
}

main().catch((err: unknown) => {
  console.error("quickstart failed:", err);
  process.exitCode = 1;
});
