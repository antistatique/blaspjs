import { describe, expect, test, vi } from 'vitest';

import type { Driver } from './core/contracts/driver.js';
import { Result } from './core/result.js';
import { Blasp, MemoryCache, Severity, blasp as defaultBlasp } from './index.js';

describe('Blasp', () => {
  const blasp = new Blasp();

  test('check detects and masks profanity (regex)', () => {
    const result = blasp.check('This is a fucking sentence');
    expect(result.isOffensive()).toBe(true);
    expect(result.clean()).toContain('*');
    expect(result.original()).toBe('This is a fucking sentence');
    expect(result.uniqueWords()).toContain('fucking');
    expect(result.score()).toBeGreaterThan(0);
  });

  test('lenient uses pattern driver', () => {
    const r = blasp.lenient().check('fuck this');
    expect(r.isOffensive()).toBe(true);
    expect(r.clean()).toMatch(/^\*+ this$/);
  });

  test('pattern driver word boundaries', () => {
    const r = new Blasp().driver('pattern').check('hello world');
    expect(r.isClean()).toBe(true);
  });

  test('phonetic driver catches phuck', () => {
    const r = new Blasp().driver('phonetic').check('phuck this');
    expect(r.isOffensive()).toBe(true);
  });

  test('grawlix mask', () => {
    const r = new Blasp().mask('grawlix').check('damn');
    expect(r.clean()).toMatch(/^[!@#$%]+$/);
  });

  test('callback mask disables cache', () => {
    const cache = new MemoryCache();
    const b = new Blasp({ cache: { enabled: true, results: true, ttl: 60, driver: null } }, { cache });
    const spy = vi.spyOn(cache, 'set');
    b.newPendingCheck()
      .mask((_w, len) => 'x'.repeat(len))
      .check('fuck');
    expect(spy).not.toHaveBeenCalled();
  });

  test('withSeverity filters mild', () => {
    const r = blasp.withSeverity(Severity.High).check('damn'); // mild
    expect(r.isClean()).toBe(true);
  });

  test('checkMany array', () => {
    const results = blasp.checkMany(['clean', 'shit']);
    expect(results).toHaveLength(2);
    expect(results[0]!.isClean()).toBe(true);
    expect(results[1]!.isOffensive()).toBe(true);
  });

  test('checkMany record', () => {
    const results = blasp.checkMany({ a: 'nice', b: 'ass' });
    expect(results.a!.isClean()).toBe(true);
    expect(results.b!.isOffensive()).toBe(true);
  });

  test('pipeline regex + phonetic', () => {
    const r = new Blasp().pipeline('regex', 'phonetic').check('phuck');
    expect(r.isOffensive()).toBe(true);
  });

  test('Result serialization', () => {
    const r = blasp.check('badword shit');
    const json = r.toJson();
    const parsed = JSON.parse(json) as { is_offensive: boolean };
    expect(parsed.is_offensive).toBe(true);
  });

  test('extend custom driver', () => {
    const b = new Blasp();
    const driver: Driver = {
      detect: text => Result.none(text),
    };
    b.extend('always-clean', () => driver);
    const r = b.driver('always-clean').check('fuck');
    expect(r.isClean()).toBe(true);
  });

  test('resolveDriver throws for unknown name', () => {
    expect(() => new Blasp().resolveDriver('no-such-driver')).toThrow(/not supported/);
  });

  test('clearCaches empties internal MemoryCache', () => {
    const b = new Blasp();
    const cache = b.getCache() as MemoryCache;
    expect(cache).not.toBeNull();
    cache.set('k', 'v', 3600);
    expect(cache.get('k')).toBe('v');
    b.clearCaches();
    expect(cache.get('k')).toBeNull();
  });

  test('getCache null when cache disabled', () => {
    const b = new Blasp({ cache: { enabled: false, results: true, ttl: 60, driver: null } });
    expect(b.getCache()).toBeNull();
  });

  test('exported default blasp instance works', () => {
    const r = defaultBlasp.driver('pattern').check('fuck');
    expect(r.isOffensive()).toBe(true);
  });

  test('driver() without name returns pending with default driver resolution', () => {
    const r = new Blasp().driver().check('fuck this');
    expect(r.isOffensive()).toBe(true);
  });

  test('block on instance', () => {
    const r = new Blasp().block('customblock99').check('customblock99');
    expect(r.isOffensive()).toBe(true);
  });

  test('allow removes fuck from list', () => {
    const r = new Blasp().allow('fuck').driver('pattern').check('fuck');
    expect(r.isClean()).toBe(true);
  });

  test('getConfig returns merged config', () => {
    const b = new Blasp({ default: 'pattern' });
    expect(b.getConfig().default).toBe('pattern');
  });

  test('resolveDriver built-ins', () => {
    const b = new Blasp();
    expect(b.resolveDriver('regex')).toBeDefined();
    expect(b.resolveDriver('pattern')).toBeDefined();
    expect(b.resolveDriver('phonetic')).toBeDefined();
    expect(b.resolveDriver('pipeline')).toBeDefined();
  });

  test('fluent entry methods return PendingCheck', () => {
    const b = new Blasp();
    expect(b.in('english').check('hi').isClean()).toBe(true);
    expect(b.inAllLanguages().check('hi').isClean()).toBe(true);
    expect(b.english().check('hi').isClean()).toBe(true);
    expect(b.spanish().check('hola').isClean()).toBe(true);
    expect(b.german().check('hallo').isClean()).toBe(true);
    expect(b.french().check('bonjour').isClean()).toBe(true);
    expect(b.mask('#').check('damn').clean()).toContain('#');
    expect(b.withSeverity(Severity.Extreme).check('damn').isClean()).toBe(true);
    expect(b.strict().check('fuck').isOffensive()).toBe(true);
    expect(b.lenient().check('fuck').isOffensive()).toBe(true);
    expect(b.maskWith('x').check('damn').clean()).toContain('x');
    expect(b.newPendingCheck().language('english').check('ok').isClean()).toBe(true);
    expect(b.newPendingCheck().configure(null).check('ok').isClean()).toBe(true);
  });

  test('check passes null as empty string', () => {
    const r = new Blasp().check(null);
    expect(r.isClean()).toBe(true);
  });
});
