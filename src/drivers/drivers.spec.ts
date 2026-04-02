import { describe, expect, test } from 'vitest';

import { defaultBlaspConfig } from '../config/defaultConfig.js';
import { Dictionary } from '../core/dictionary.js';
import { CharacterMask } from '../core/masking/characterMask.js';
import { PatternDriver } from './patternDriver.js';
import { PhoneticDriver } from './phoneticDriver.js';
import { PipelineDriver } from './pipelineDriver.js';
import { RegexDriver } from './regexDriver.js';

describe('RegexDriver', () => {
  const dict = () => Dictionary.forLanguage('english', defaultBlaspConfig);
  const mask = new CharacterMask('*');

  test('empty string', () => {
    const r = new RegexDriver().detect('', dict(), mask, {});
    expect(r.isClean()).toBe(true);
    expect(r.clean()).toBe('');
  });

  test('separator obfuscation', () => {
    const r = new RegexDriver().detect('f-u-c-k you', dict(), mask, {});
    expect(r.isOffensive()).toBe(true);
  });

  test('substitution obfuscation', () => {
    const r = new RegexDriver().detect('f@ck', dict(), mask, {});
    expect(r.isOffensive()).toBe(true);
  });
});

describe('PatternDriver', () => {
  const dict = () => Dictionary.forLanguage('english', defaultBlaspConfig);
  const mask = new CharacterMask('*');

  test('deduplicates overlapping longest-first', () => {
    const r = new PatternDriver().detect('assessment', dict(), mask, {});
    expect(r.isClean()).toBe(true);
  });
});

describe('PhoneticDriver', () => {
  const dict = () => Dictionary.forLanguage('english', defaultBlaspConfig);
  const mask = new CharacterMask('*');

  test('returns clean for unsupported multi-language label', () => {
    const d = Dictionary.forLanguages(['spanish', 'french'], defaultBlaspConfig);
    const r = new PhoneticDriver().detect('hola', d, mask, {});
    expect(r.isClean()).toBe(true);
  });

  test('empty input', () => {
    expect(new PhoneticDriver().detect('', dict(), mask, {}).isClean()).toBe(true);
  });
});

describe('PipelineDriver', () => {
  const dict = () => Dictionary.forLanguage('english', defaultBlaspConfig);
  const mask = new CharacterMask('*');

  test('merges non-overlapping matches', () => {
    const pipe = new PipelineDriver([new PatternDriver(), new PatternDriver()]);
    const r = pipe.detect('fuck shit', dict(), mask, {});
    expect(r.isOffensive()).toBe(true);
  });

  test('empty', () => {
    const pipe = new PipelineDriver([new RegexDriver()]);
    expect(pipe.detect('', dict(), mask, {}).isClean()).toBe(true);
  });
});
