import type { DetectOptions, Driver } from './contracts/driver.js';
import type { MaskStrategy } from './contracts/maskStrategy.js';
import type { Dictionary } from './dictionary.js';
import { Result } from './result.js';

export function analyze(
  text: string,
  driver: Driver,
  dictionary: Dictionary,
  mask: MaskStrategy,
  options: DetectOptions = {}
): Result {
  return driver.detect(text, dictionary, mask, options);
}
