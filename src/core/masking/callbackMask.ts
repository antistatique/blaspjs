import type { MaskStrategy } from '../contracts/maskStrategy.js';

export class CallbackMask implements MaskStrategy {
  constructor(private readonly callback: (word: string, length: number) => string) {}

  mask(word: string, length: number): string {
    return this.callback(word, length);
  }

  cacheKey(): string {
    return 'callback';
  }
}
