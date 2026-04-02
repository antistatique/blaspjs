import { describe, expect, test } from 'vitest';

import { AVAILABLE_LANGUAGES, loadLanguageConfig } from './registry.js';

describe('language registry', () => {
  test('AVAILABLE_LANGUAGES lists bundled packs', () => {
    expect(new Set(AVAILABLE_LANGUAGES)).toEqual(new Set(['english', 'french', 'german', 'spanish']));
  });

  test('loadLanguageConfig rejects invalid names', () => {
    expect(loadLanguageConfig('../x').profanities).toEqual([]);
  });

  test('loadLanguageConfig returns data for english', () => {
    const c = loadLanguageConfig('english');
    expect(c.profanities?.length).toBeGreaterThan(0);
  });
});
