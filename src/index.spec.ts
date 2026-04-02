import { describe, expect, test } from 'vitest';

import * as api from './index.js';

describe('package exports', () => {
  test('core symbols are defined', () => {
    expect(api.Blasp).toBeDefined();
    expect(api.blasp).toBeDefined();
    expect(api.PendingCheck).toBeDefined();
    expect(api.Result).toBeDefined();
    expect(api.MatchedWord).toBeDefined();
    expect(api.Dictionary).toBeDefined();
    expect(api.Severity).toBeDefined();
    expect(api.mergeBlaspConfig).toBeDefined();
    expect(api.defaultBlaspConfig).toBeDefined();
    expect(api.RegexDriver).toBeDefined();
    expect(api.PatternDriver).toBeDefined();
    expect(api.PhoneticDriver).toBeDefined();
    expect(api.PipelineDriver).toBeDefined();
    expect(api.MemoryCache).toBeDefined();
    expect(api.AVAILABLE_LANGUAGES).toBeDefined();
    expect(api.LANGUAGE_DATA).toBeDefined();
    expect(api.loadLanguageConfig).toBeDefined();
  });
});
