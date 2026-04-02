import { describe, expect, test } from 'vitest';

import { Severity } from '../enums/severity.js';
import { MatchedWord } from './matchedWord.js';
import { calculateScore } from './score.js';

describe('calculateScore', () => {
  test('empty matches returns 0', () => {
    expect(calculateScore([], 10)).toBe(0);
  });

  test('single high severity', () => {
    const w = [new MatchedWord('x', 'fuck', Severity.High, 0, 4)];
    const s = calculateScore(w, 5);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  test('caps at 100 with many matches', () => {
    const words = Array.from({ length: 20 }, (_, i) => new MatchedWord('x', 'a', Severity.Extreme, i, 1));
    expect(calculateScore(words, 2)).toBe(100);
  });

  test('density increases score vs same raw with fewer words', () => {
    const one = [new MatchedWord('a', 'b', Severity.High, 0, 1)];
    const s1 = calculateScore(one, 100);
    const s2 = calculateScore(one, 1);
    expect(s2).toBeGreaterThan(s1);
  });
});
