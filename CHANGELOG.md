# Changelog

All notable changes to `@graphann/client` are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/) and the project uses
[Semantic Versioning](https://semver.org/).

## 0.1.0 — initial release

- First public TypeScript SDK for GraphANN.
- Methods cover: health, tenant CRUD, index CRUD + maintenance, document
  ingestion / import / bulk-delete / cursor-pagination, search (text /
  vector / hybrid / multi-source), async jobs (hot model switch + read /
  list), cluster read-only introspection, LLM settings, API key
  management (forward-looking).
- Dual ESM + CJS distribution with type declarations.
- Built-in retry policy honoring `Retry-After`, exponential backoff with
  jitter, single-flight coalescing, optional LRU+TTL response cache,
  optional metrics hook, and gzip of large request bodies.
- Tested with vitest + msw on Node 20+; integration suite gated by
  `GRAPHANN_BASE_URL` / `GRAPHANN_API_KEY` environment variables.
