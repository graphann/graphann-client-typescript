/**
 * Tiny LRU + TTL response cache. Zero dependencies — Map insertion order is
 * stable, so re-inserting on access gives us LRU semantics for free.
 *
 * The cache is opt-in (disabled by default in `ClientOptions`). When enabled,
 * only safe, idempotent reads (GET) are cached.
 */

interface CacheEntry<V> {
  value: V;
  /** Absolute expiry timestamp (ms since epoch). */
  expiresAt: number;
}

export class LRUCache<K, V> {
  private readonly map = new Map<K, CacheEntry<V>>();

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number,
  ) {
    if (maxSize <= 0) throw new Error("LRUCache maxSize must be > 0");
    if (ttlMs < 0) throw new Error("LRUCache ttlMs must be >= 0");
  }

  get(key: K, now: number = Date.now()): V | undefined {
    const entry = this.map.get(key);
    if (entry === undefined) return undefined;
    if (entry.expiresAt <= now) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh recency: re-insert moves the key to the tail.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, now: number = Date.now()): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: now + this.ttlMs });
    if (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next();
      if (!oldest.done) this.map.delete(oldest.value);
    }
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}
