import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { MemoryCache } from './memoryCache.js';

describe('MemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('get returns null for missing key', () => {
    const c = new MemoryCache();
    expect(c.get('k')).toBeNull();
  });

  test('set and get', () => {
    const c = new MemoryCache();
    c.set('k', 'v', 60);
    expect(c.get('k')).toBe('v');
  });

  test('expired entry is removed', () => {
    const c = new MemoryCache();
    c.set('k', 'v', 1);
    vi.advanceTimersByTime(2000);
    expect(c.get('k')).toBeNull();
  });

  test('clear', () => {
    const c = new MemoryCache();
    c.set('k', 'v', 60);
    c.clear();
    expect(c.get('k')).toBeNull();
  });
});
