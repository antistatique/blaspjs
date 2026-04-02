import type { MaskStrategy } from '../contracts/maskStrategy.js';

const CHARS = ['!', '@', '#', '$', '%'];

export class GrawlixMask implements MaskStrategy {
  mask(_word: string, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += CHARS[i % CHARS.length];
    }
    return result;
  }

  cacheKey(): string {
    return 'grawlix';
  }
}
