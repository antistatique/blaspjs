export type CacheAdapter = {
  get(key: string): string | null;
  set(key: string, value: string, ttlSeconds: number): void;
};
