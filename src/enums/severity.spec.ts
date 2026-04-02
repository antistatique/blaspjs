import { describe, expect, test } from 'vitest';

import { Severity, severityIsAtLeast, severityWeight, trySeverity } from './severity.js';

describe('Severity', () => {
  test('severityWeight matches PHP ordering', () => {
    expect(severityWeight(Severity.Mild)).toBe(5);
    expect(severityWeight(Severity.Moderate)).toBe(15);
    expect(severityWeight(Severity.High)).toBe(30);
    expect(severityWeight(Severity.Extreme)).toBe(50);
  });

  test('severityIsAtLeast', () => {
    expect(severityIsAtLeast(Severity.High, Severity.Moderate)).toBe(true);
    expect(severityIsAtLeast(Severity.Mild, Severity.High)).toBe(false);
    expect(severityIsAtLeast(Severity.High, Severity.High)).toBe(true);
  });

  test('trySeverity', () => {
    expect(trySeverity('high')).toBe(Severity.High);
    expect(trySeverity('EXTREME')).toBe(Severity.Extreme);
    expect(trySeverity(undefined)).toBeUndefined();
    expect(trySeverity('')).toBeUndefined();
    expect(trySeverity('nope')).toBeUndefined();
  });
});
