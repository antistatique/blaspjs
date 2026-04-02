import { describe, expect, test } from 'vitest';

import { EnglishNormalizer } from './englishNormalizer.js';
import { FrenchNormalizer } from './frenchNormalizer.js';
import { GermanNormalizer } from './germanNormalizer.js';
import { getNormalizerForLanguage } from './index.js';
import { SpanishNormalizer } from './spanishNormalizer.js';

describe('EnglishNormalizer', () => {
  test('identity', () => {
    expect(new EnglishNormalizer().normalize('café')).toBe('café');
  });
});

describe('SpanishNormalizer', () => {
  test('strips accents and ll rule', () => {
    const n = new SpanishNormalizer();
    expect(n.normalize('niño')).toBe('nino');
    expect(n.normalize('café')).toBe('cafe');
  });
});

describe('GermanNormalizer', () => {
  test('esszet and umlauts', () => {
    const n = new GermanNormalizer();
    expect(n.normalize('Straße')).toContain('ss');
    expect(n.normalize('über')).toContain('ue');
  });
});

describe('FrenchNormalizer', () => {
  test('accents', () => {
    const n = new FrenchNormalizer();
    expect(n.normalize('été')).toBe('ete');
  });
});

describe('getNormalizerForLanguage', () => {
  test('known languages', () => {
    expect(getNormalizerForLanguage('english')).toBeInstanceOf(EnglishNormalizer);
    expect(getNormalizerForLanguage('SPANISH')).toBeInstanceOf(SpanishNormalizer);
    expect(getNormalizerForLanguage('german')).toBeInstanceOf(GermanNormalizer);
    expect(getNormalizerForLanguage('french')).toBeInstanceOf(FrenchNormalizer);
  });

  test('unknown falls back to English', () => {
    expect(getNormalizerForLanguage('klingon')).toBeInstanceOf(EnglishNormalizer);
  });
});
