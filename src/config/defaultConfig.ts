import { Severity } from '../enums/severity.js';
import blaspDefaults from './blasp-defaults.json' with { type: 'json' };
import type { BlaspConfig } from './types.js';

const d = blaspDefaults as {
  separators: string[];
  substitutions: Record<string, string[]>;
  false_positives: string[];
  allow: string[];
  block: string[];
};

export const defaultBlaspConfig: BlaspConfig = {
  default: 'regex',
  language: 'english',
  default_language: 'english',
  mask: '*',
  mask_character: '*',
  severity: Severity.Mild,
  events: false,
  cache: {
    enabled: true,
    driver: null,
    ttl: 86400,
    results: true,
    max_tracked_keys: 1000,
  },
  cache_driver: null,
  middleware: {
    action: 'reject',
    fields: ['*'],
    except: ['password', 'email', '_token'],
    severity: 'mild',
  },
  model: { mode: 'sanitize' },
  drivers: {
    pipeline: {
      drivers: ['regex', 'phonetic'],
    },
    phonetic: {
      phonemes: 4,
      min_word_length: 3,
      max_distance_ratio: 0.6,
      supported_languages: ['english'],
      false_positives: [
        'fork',
        'forked',
        'forking',
        'beach',
        'beaches',
        'witch',
        'witches',
        'sheet',
        'sheets',
        'deck',
        'decks',
        'count',
        'counts',
        'counter',
        'county',
        'ship',
        'shipped',
        'shipping',
        'duck',
        'ducked',
        'ducking',
        'fudge',
        'fudging',
        'buck',
        'bucks',
        'puck',
        'pucks',
        'bass',
        'mass',
        'pass',
        'passed',
        'heck',
        'shoot',
        'shot',
        'what',
        'white',
        'while',
        'whole',
      ],
    },
  },
  separators: d.separators,
  substitutions: d.substitutions,
  false_positives: d.false_positives,
  allow: d.allow,
  block: d.block,
};

export function mergeBlaspConfig(base: BlaspConfig, patch: Partial<BlaspConfig> | undefined): BlaspConfig {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    cache: { ...base.cache, ...patch.cache },
    middleware: { ...base.middleware, ...patch.middleware },
    model: { ...base.model, ...patch.model },
    drivers: {
      pipeline: { ...base.drivers.pipeline, ...patch.drivers?.pipeline },
      phonetic: { ...base.drivers.phonetic, ...patch.drivers?.phonetic },
    },
    separators: patch.separators ?? base.separators,
    substitutions: patch.substitutions ?? base.substitutions,
    false_positives: patch.false_positives ?? base.false_positives,
    allow: patch.allow ?? base.allow,
    block: patch.block ?? base.block,
  };
}
