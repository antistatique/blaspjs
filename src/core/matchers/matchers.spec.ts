import { describe, expect, test } from 'vitest';

import { utf16IndexToUtf8ByteOffset } from '../utf8.js';
import { CompoundWordDetector } from './compoundWordDetector.js';
import { FalsePositiveFilter } from './falsePositiveFilter.js';
import { PhoneticMatcher } from './phoneticMatcher.js';

describe('FalsePositiveFilter', () => {
  test('isFalsePositive', () => {
    const f = new FalsePositiveFilter(['Hello', 'CLASS']);
    expect(f.isFalsePositive('hello')).toBe(true);
    expect(f.isFalsePositive('class')).toBe(true);
    expect(f.isFalsePositive('nope')).toBe(false);
  });

  test('isInsideHexToken detects UUID', () => {
    const f = new FalsePositiveFilter([]);
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const idx = id.indexOf('e29b');
    expect(f.isInsideHexToken(id, idx, 4)).toBe(true);
  });

  test('getFullWordContext', () => {
    const f = new FalsePositiveFilter([]);
    const s = 'foo_bar_baz';
    const start = 4;
    const len = 3;
    expect(f.getFullWordContext(s, start, len)).toContain('bar');
  });

  test('isSpanningWordBoundary embedded both sides', () => {
    const f = new FalsePositiveFilter([]);
    const full = 'wf u ckz';
    const matched = 'f u ck';
    const idx = full.indexOf('f');
    const byteStart = utf16IndexToUtf8ByteOffset(full, idx);
    expect(f.isSpanningWordBoundary(matched, full, byteStart)).toBe(true);
  });

  test('isSpanningWordBoundary all single-letter parts returns false', () => {
    const f = new FalsePositiveFilter([]);
    const full = 'a f u c z';
    const matched = 'f u c';
    const idx = full.indexOf('f');
    expect(f.isSpanningWordBoundary(matched, full, utf16IndexToUtf8ByteOffset(full, idx))).toBe(false);
  });
});

describe('CompoundWordDetector', () => {
  test('returns false for non-alpha match', () => {
    const d = new CompoundWordDetector();
    const expr = new Map([['fuck', /x/u]]);
    expect(d.isPureAlphaSubstring('f4ck', 'xf4cky', 'fuck', expr)).toBe(false);
  });

  test('returns false when word equals match length', () => {
    const d = new CompoundWordDetector();
    const expr = new Map<string, RegExp>();
    expect(d.isPureAlphaSubstring('bad', 'bad', 'bad', expr)).toBe(false);
  });
});

describe('PhoneticMatcher', () => {
  test('match returns null for short words', () => {
    const m = new PhoneticMatcher(['fuck'], 4, 5, 0.6, []);
    expect(m.match('ab')).toBeNull();
  });

  test('match returns null for phonetic false positive', () => {
    const m = new PhoneticMatcher(['fuck'], 4, 3, 0.6, ['fork']);
    expect(m.match('fork')).toBeNull();
  });

  test('match finds phonetic neighbour', () => {
    const m = new PhoneticMatcher(['fuck'], 4, 3, 0.6, []);
    expect(m.match('phuck')).toBe('fuck');
  });
});
