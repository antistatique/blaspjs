import type { CacheAdapter } from './types.js';

type Entry = { value: string; expiresAt: number };

export class MemoryCache implements CacheAdapter {
  private readonly map = new Map<string, Entry>();

  get(key: string): string | null {
    const e = this.map.get(key);
    if (!e) {
      return null;
    }
    if (Date.now() > e.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return e.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  clear(): void {
    this.map.clear();
  }
}
