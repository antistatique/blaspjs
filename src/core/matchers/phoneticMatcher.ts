import { distance } from 'fastest-levenshtein';
import { metaphone } from 'metaphone';

import { cpLen } from '../utf8.js';

function phpMetaphone(str: string, phonemes: number): string {
  const raw = metaphone(String(str));
  if (phonemes > 0) {
    return raw.slice(0, phonemes);
  }
  return raw;
}

export class PhoneticMatcher {
  private readonly index = new Map<string, string[]>();
  private readonly phoneticFalsePositives: Set<string>;

  constructor(
    profanities: string[],
    private readonly phonemes: number,
    private readonly minWordLength: number,
    private readonly maxDistanceRatio: number,
    phoneticFalsePositives: string[]
  ) {
    this.phoneticFalsePositives = new Set(phoneticFalsePositives.map(fp => fp.toLowerCase()));
    this.buildIndex(profanities);
  }

  private buildIndex(profanities: string[]): void {
    for (const word of profanities) {
      const lower = word.toLowerCase();
      if (cpLen(lower) < this.minWordLength) {
        continue;
      }

      const code = phpMetaphone(lower, this.phonemes);
      if (code === '') {
        continue;
      }

      const list = this.index.get(code) ?? [];
      list.push(lower);
      this.index.set(code, list);
    }

    for (const [code, words] of this.index) {
      this.index.set(code, [...new Set(words)]);
    }
  }

  match(word: string): string | null {
    const lower = word.toLowerCase();

    if (cpLen(lower) < this.minWordLength) {
      return null;
    }

    if (this.phoneticFalsePositives.has(lower)) {
      return null;
    }

    const code = phpMetaphone(lower, this.phonemes);
    if (code === '' || !this.index.has(code)) {
      return null;
    }

    let bestMatch: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const profanity of this.index.get(code) ?? []) {
      const dist = distance(lower, profanity);
      const maxLen = Math.max(cpLen(lower), cpLen(profanity));
      const threshold = Math.ceil(this.maxDistanceRatio * maxLen);

      if (dist <= threshold && dist < bestDistance) {
        bestDistance = dist;
        bestMatch = profanity;
      }
    }

    return bestMatch;
  }
}
