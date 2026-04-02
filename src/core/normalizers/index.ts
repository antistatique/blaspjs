import { EnglishNormalizer } from './englishNormalizer.js';
import { FrenchNormalizer } from './frenchNormalizer.js';
import { GermanNormalizer } from './germanNormalizer.js';
import { SpanishNormalizer } from './spanishNormalizer.js';
import type { StringNormalizer } from './types.js';

const cache = new Map<string, StringNormalizer>();

export function getNormalizerForLanguage(language: string): StringNormalizer {
  const key = language.toLowerCase();
  let n = cache.get(key);
  if (n) return n;
  switch (key) {
    case 'english':
      n = new EnglishNormalizer();
      break;
    case 'spanish':
      n = new SpanishNormalizer();
      break;
    case 'german':
      n = new GermanNormalizer();
      break;
    case 'french':
      n = new FrenchNormalizer();
      break;
    default:
      n = new EnglishNormalizer();
  }
  cache.set(key, n);
  return n;
}

export type { StringNormalizer };
