import type { Severity } from '../../enums/severity.js';
import type { Dictionary } from '../dictionary.js';
import type { Result } from '../result.js';
import type { MaskStrategy } from './maskStrategy.js';

export type DetectOptions = {
  severity?: Severity;
};

export type Driver = {
  detect(text: string, dictionary: Dictionary, mask: MaskStrategy, options?: DetectOptions): Result;
};
