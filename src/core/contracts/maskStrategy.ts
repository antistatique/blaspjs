export type MaskStrategy = {
  mask(word: string, length: number): string;
  /** Stable id so cached results differ when masking changes. */
  cacheKey(): string;
};
