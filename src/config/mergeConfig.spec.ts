import { describe, expect, test } from 'vitest';

import { defaultBlaspConfig, mergeBlaspConfig } from './defaultConfig.js';

describe('mergeBlaspConfig', () => {
  test('merges shallow and nested', () => {
    const m = mergeBlaspConfig(defaultBlaspConfig, {
      default: 'pattern',
      cache: { enabled: false },
      drivers: {
        phonetic: { min_word_length: 5 },
      },
    });
    expect(m.default).toBe('pattern');
    expect(m.cache.enabled).toBe(false);
    expect(m.cache.ttl).toBe(defaultBlaspConfig.cache.ttl);
    expect(m.drivers.phonetic.min_word_length).toBe(5);
    expect(m.drivers.phonetic.phonemes).toBe(defaultBlaspConfig.drivers.phonetic.phonemes);
  });

  test('without patch returns base', () => {
    expect(mergeBlaspConfig(defaultBlaspConfig, undefined)).toBe(defaultBlaspConfig);
  });
});
