import { describe, expect, test } from 'vitest';

import { Severity } from '../enums/severity.js';
import { MatchedWord } from './matchedWord.js';

describe('MatchedWord', () => {
  test('toArray', () => {
    const w = new MatchedWord('text', 'base', Severity.Moderate, 2, 4, 'spanish');
    expect(w.toArray()).toMatchObject({
      text: 'text',
      base: 'base',
      severity: Severity.Moderate,
      position: 2,
      length: 4,
      language: 'spanish',
    });
  });
});
