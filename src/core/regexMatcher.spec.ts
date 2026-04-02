import { describe, expect, test } from 'vitest';

import { defaultBlaspConfig } from '../config/defaultConfig.js';
import { RegexMatcher } from './regexMatcher.js';

describe('RegexMatcher', () => {
  const matcher = new RegexMatcher();

  test('generateSeparatorExpression allows dot before word char', () => {
    const sep = matcher.generateSeparatorExpression(['@']);
    expect(sep).toContain('\\.');
  });

  test('generateExpressions produces RegExp per profanity', () => {
    const map = matcher.generateExpressions(['bad'], defaultBlaspConfig.separators, defaultBlaspConfig.substitutions);
    expect(map.has('bad')).toBe(true);
    expect(map.get('bad')!.test('bad')).toBe(true);
  });

  test('substitutions allow obfuscated match', () => {
    const map = matcher.generateExpressions(['bad'], defaultBlaspConfig.separators, defaultBlaspConfig.substitutions);
    const re = map.get('bad')!;
    expect(re.test('b@d')).toBe(true);
  });

  test('multi-char substitution branch escapes regex metacharacters (e.g. *)', () => {
    const subs = { a: ['a', 'x*'] };
    expect(() => matcher.generateExpressions(['cat'], defaultBlaspConfig.separators, subs)).not.toThrow();
    const map = matcher.generateExpressions(['cat'], defaultBlaspConfig.separators, subs);
    expect(map.get('cat')!.test('cx*t')).toBe(true);
  });
});
