import { describe, expect, test } from 'vitest';

import { Severity } from '../enums/severity.js';
import { MatchedWord } from './matchedWord.js';
import { Result } from './result.js';

describe('Result', () => {
  test('none', () => {
    const r = Result.none('hello');
    expect(r.isClean()).toBe(true);
    expect(r.clean()).toBe('hello');
    expect(r.severity()).toBeNull();
    expect(r.count()).toBe(0);
  });

  test('isOffensive / uniqueWords / severity', () => {
    const w1 = new MatchedWord('damn', 'damn', Severity.Mild, 0, 4);
    const w2 = new MatchedWord('shit', 'shit', Severity.High, 5, 4);
    const r = new Result('x', 'y', [w1, w2], 50);
    expect(r.isOffensive()).toBe(true);
    expect(r.uniqueWords()).toEqual(['damn', 'shit']);
    expect(r.severity()).toBe(Severity.High);
  });

  test('legacy aliases', () => {
    const r = Result.none('ok');
    expect(r.hasProfanity()).toBe(false);
    expect(r.getCleanString()).toBe('ok');
    expect(r.getSourceString()).toBe('ok');
    expect(r.getProfanitiesCount()).toBe(0);
    expect(r.getUniqueProfanitiesFound()).toEqual([]);
  });

  test('fromArray roundtrip', () => {
    const r0 = new Result('orig', 'cln', [new MatchedWord('bad', 'bad', Severity.Moderate, 0, 3, 'english')], 12);
    const r1 = Result.fromArray(r0.toArray());
    expect(r1.original()).toBe('orig');
    expect(r1.clean()).toBe('cln');
    expect(r1.score()).toBe(12);
    expect(r1.count()).toBe(1);
    expect(r1.words()[0]!.base).toBe('bad');
  });

  test('fromArray defaults invalid severity to High', () => {
    const r = Result.fromArray({
      original: 'a',
      clean: 'a',
      words: [{ text: 'x', base: 'x', severity: 'invalid', position: 0, length: 1 }],
      score: 0,
    });
    expect(r.words()[0]!.severity).toBe(Severity.High);
  });

  test('withMatches string words', () => {
    const r = Result.withMatches(['fuck'], 'oh fuck', 'oh ****');
    expect(r.isOffensive()).toBe(true);
    expect(r.count()).toBe(1);
  });

  test('withMatches MatchedWord instances', () => {
    const m = new MatchedWord('x', 'y', Severity.High, 0, 1);
    const r = Result.withMatches([m], 'x', '*');
    expect(r.count()).toBe(1);
  });

  test('iterator and length', () => {
    const r = new Result('a', 'b', [new MatchedWord('x', 'y', Severity.High, 0, 1)], 1);
    expect(r.length).toBe(1);
    expect([...r]).toHaveLength(1);
  });

  test('toString', () => {
    expect(String(new Result('a', 'masked', [], 0))).toBe('masked');
  });
});
