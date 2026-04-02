import type { LanguageFileJson } from '../config/types.js';
import english from './english.json' with { type: 'json' };
import french from './french.json' with { type: 'json' };
import german from './german.json' with { type: 'json' };
import spanish from './spanish.json' with { type: 'json' };

export const LANGUAGE_DATA: Record<string, LanguageFileJson> = {
  english: english as LanguageFileJson,
  spanish: spanish as LanguageFileJson,
  german: german as LanguageFileJson,
  french: french as LanguageFileJson,
};

export const AVAILABLE_LANGUAGES = Object.keys(LANGUAGE_DATA);

export function loadLanguageConfig(language: string): LanguageFileJson {
  if (!/^[a-zA-Z0-9_-]+$/.test(language)) {
    return { profanities: [], false_positives: [] };
  }
  return LANGUAGE_DATA[language.toLowerCase()] ?? { profanities: [], false_positives: [] };
}
