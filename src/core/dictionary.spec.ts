import { describe, expect, test } from 'vitest';

import { defaultBlaspConfig } from '../config/defaultConfig.js';
import { Severity } from '../enums/severity.js';
import { AVAILABLE_LANGUAGES } from '../languages/registry.js';
import { Dictionary } from './dictionary.js';

describe('Dictionary', () => {
  test('forLanguage english loads profanities', () => {
    const d = Dictionary.forLanguage('english', defaultBlaspConfig);
    expect(d.getProfanities().length).toBeGreaterThan(100);
    expect(d.getLanguage()).toBe('english');
    expect(d.getSeverity('fuck')).toBe(Severity.High);
  });

  test('forLanguage invalid id returns empty', () => {
    const d = Dictionary.forLanguage('bad;injection', defaultBlaspConfig);
    expect(d.getProfanities()).toEqual([]);
  });

  test('forLanguages merges', () => {
    const d = Dictionary.forLanguages(['english', 'spanish'], defaultBlaspConfig);
    expect(d.getLanguage()).toContain('english');
    expect(d.getProfanities().length).toBeGreaterThan(dictionaryEnglishCount());
  });

  test('forAllLanguages', () => {
    const d = Dictionary.forAllLanguages(defaultBlaspConfig);
    expect(d.getProfanities().length).toBeGreaterThan(0);
  });

  test('block adds high severity word', () => {
    const d = Dictionary.forLanguage('english', defaultBlaspConfig, { block: ['zzzuniqueblock'] });
    expect(d.getProfanities().some(p => p.toLowerCase() === 'zzzuniqueblock')).toBe(true);
    expect(d.getSeverity('zzzuniqueblock')).toBe(Severity.High);
  });

  test('allow removes word', () => {
    const d = Dictionary.forLanguage('english', defaultBlaspConfig, { allow: ['fuck'] });
    expect(d.getProfanities().every(p => p.toLowerCase() !== 'fuck')).toBe(true);
  });

  test('getAvailableLanguages', () => {
    expect(AVAILABLE_LANGUAGES).toContain('english');
    expect(Dictionary.getAvailableLanguages()).toEqual(AVAILABLE_LANGUAGES);
  });

  test('getSeparators and getSubstitutions', () => {
    const d = Dictionary.forLanguage('english', defaultBlaspConfig);
    expect(d.getSeparators().length).toBeGreaterThan(0);
    expect(Object.keys(d.getSubstitutions()).length).toBeGreaterThan(0);
  });
});

function dictionaryEnglishCount(): number {
  return Dictionary.forLanguage('english', defaultBlaspConfig).getProfanities().length;
}
