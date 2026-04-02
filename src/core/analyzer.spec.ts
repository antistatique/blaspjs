import { describe, expect, test } from 'vitest';

import { defaultBlaspConfig } from '../config/defaultConfig.js';
import { PatternDriver } from '../drivers/patternDriver.js';
import { analyze } from './analyzer.js';
import { Dictionary } from './dictionary.js';
import { CharacterMask } from './masking/characterMask.js';

describe('analyze', () => {
  test('delegates to driver', () => {
    const dict = Dictionary.forLanguage('english', defaultBlaspConfig);
    const mask = new CharacterMask('*');
    const r = analyze('fuck', new PatternDriver(), dict, mask, {});
    expect(r.isOffensive()).toBe(true);
  });
});
