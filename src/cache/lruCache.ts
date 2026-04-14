export class LruCache<K, V> {
  private readonly map = new Map<K, V>();
  constructor(private readonly maxEntries: number) {}

  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    // Refresh recency.
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    this.evictIfNeeded();
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }

  private evictIfNeeded(): void {
    if (this.maxEntries <= 0) {
      this.map.clear();
      return;
    }
    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as K | undefined;
      if (oldestKey === undefined) return;
      this.map.delete(oldestKey);
    }
  }
}
