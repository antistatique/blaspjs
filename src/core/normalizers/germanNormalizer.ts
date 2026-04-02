import type { StringNormalizer } from './types.js';

export class GermanNormalizer implements StringNormalizer {
  normalize(str: string): string {
    const germanMappings: Record<string, string> = {
      ä: 'ae',
      Ä: 'AE',
      ö: 'oe',
      Ö: 'OE',
      ü: 'ue',
      Ü: 'UE',
      ß: 'ss',
    };

    let normalizedString = str;
    for (const [k, v] of Object.entries(germanMappings)) {
      normalizedString = normalizedString.split(k).join(v);
    }

    normalizedString = normalizedString.replace(/sch/gi, match => {
      if (match === 'SCH') return 'SH';
      if (match === 'Sch') return 'Sh';
      return 'sh';
    });

    return normalizedString;
  }
}
