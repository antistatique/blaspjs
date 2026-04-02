import type { StringNormalizer } from './types.js';

export class EnglishNormalizer implements StringNormalizer {
  normalize(str: string): string {
    return str;
  }
}
