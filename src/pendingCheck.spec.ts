import { describe, expect, test, vi } from 'vitest';

import { Blasp } from './blasp.js';
import { MemoryCache } from './cache/memoryCache.js';
import { Result } from './core/result.js';

describe('PendingCheck', () => {
  test('caches identical check', () => {
    const cache = new MemoryCache();
    const blasp = new Blasp({ cache: { enabled: true, results: true, ttl: 3600, driver: null } }, { cache });
    const p = blasp.newPendingCheck().driver('pattern');
    const a = p.check('fuck');
    const b = p.check('fuck');
    expect(a.isOffensive()).toBe(true);
    expect(b.isOffensive()).toBe(true);
    expect(b.clean()).toBe(a.clean());
  });

  test('invalid cached JSON falls through to live check', () => {
    const corrupt: import('./cache/types.js').CacheAdapter = {
      get: () => '{',
      set: () => {},
    };
    const blasp = new Blasp(
      { cache: { enabled: true, results: true, ttl: 3600, driver: null } },
      {
        cache: corrupt,
      }
    );
    const r = blasp.newPendingCheck().driver('pattern').check('fuck');
    expect(r.isOffensive()).toBe(true);
  });

  test('configure adds block words', () => {
    const blasp = new Blasp();
    const r = blasp.newPendingCheck().configure(['uniquexyz123']).check('uniquexyz123');
    expect(r.isOffensive()).toBe(true);
  });

  test('deprecated allLanguages()', () => {
    const blasp = new Blasp();
    const r = blasp.newPendingCheck().allLanguages().driver('pattern').check('zzz');
    expect(r.isClean()).toBe(true);
  });
});

describe('PendingCheck callbacks', () => {
  test('onProfanityDetected when offensive', () => {
    const fn = vi.fn();
    const blasp = new Blasp(undefined, { onProfanityDetected: fn });
    blasp.check('fuck');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0]![0]).toBeInstanceOf(Result);
    expect(fn.mock.calls[0]![1]).toBe('fuck');
  });

  test('onProfanityDetected not called when clean', () => {
    const fn = vi.fn();
    const blasp = new Blasp(undefined, { onProfanityDetected: fn });
    blasp.check('hello world');
    expect(fn).not.toHaveBeenCalled();
  });
});
