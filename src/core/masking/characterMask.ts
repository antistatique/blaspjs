import type { MaskStrategy } from '../contracts/maskStrategy.js';
import { cpSlice } from '../utf8.js';

export class CharacterMask implements MaskStrategy {
  private readonly character: string;

  constructor(character = '*') {
    this.character = cpSlice(character, 0, 1);
  }

  mask(_word: string, length: number): string {
    return this.character.repeat(length);
  }

  cacheKey(): string {
    return `char:${this.character}`;
  }
}
