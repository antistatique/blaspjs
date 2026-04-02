import type { StringNormalizer } from './types.js';

export class SpanishNormalizer implements StringNormalizer {
  normalize(str: string): string {
    const spanishMappings: Record<string, string> = {
      á: 'a',
      Á: 'A',
      é: 'e',
      É: 'E',
      í: 'i',
      Í: 'I',
      ó: 'o',
      Ó: 'O',
      ú: 'u',
      Ú: 'U',
      ü: 'u',
      Ü: 'U',
      ñ: 'n',
      Ñ: 'N',
    };

    let normalizedString = str;
    for (const [k, v] of Object.entries(spanishMappings)) {
      normalizedString = normalizedString.split(k).join(v);
    }

    normalizedString = normalizedString.replace(/\bll(?=[aeiouáéíóúü])/gi, match => {
      if (match === 'LL') return 'Y';
      if (match === 'Ll') return 'Y';
      return 'y';
    });

    normalizedString = normalizedString.replace(/rr/gi, match => {
      if (match === 'RR') return 'R';
      if (match === 'Rr') return 'R';
      return 'r';
    });

    return normalizedString;
  }
}
