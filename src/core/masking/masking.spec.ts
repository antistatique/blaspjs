import { describe, expect, test } from 'vitest';

import { CallbackMask } from './callbackMask.js';
import { CharacterMask } from './characterMask.js';
import { GrawlixMask } from './grawlixMask.js';

describe('CharacterMask', () => {
  test('repeats first grapheme of mask char', () => {
    expect(new CharacterMask('*').mask('foo', 3)).toBe('***');
    expect(new CharacterMask('##').mask('x', 2)).toBe('##');
  });

  test('cacheKey', () => {
    expect(new CharacterMask('#').cacheKey()).toBe('char:#');
  });
});

describe('GrawlixMask', () => {
  test('cycles chars', () => {
    expect(new GrawlixMask().mask('', 5)).toBe('!@#$%');
  });

  test('cacheKey', () => {
    expect(new GrawlixMask().cacheKey()).toBe('grawlix');
  });
});

describe('CallbackMask', () => {
  test('invokes callback', () => {
    const m = new CallbackMask((w, len) => `${len}:${w}`);
    expect(m.mask('hi', 2)).toBe('2:hi');
  });

  test('cacheKey', () => {
    expect(new CallbackMask(() => '').cacheKey()).toBe('callback');
  });
});
