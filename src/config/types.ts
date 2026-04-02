import type { Severity } from '../enums/severity.js';

export type DriverName = 'regex' | 'pattern' | 'phonetic' | 'pipeline';

export type BlaspGlobalPartial = {
  separators: string[];
  substitutions: Record<string, string[]>;
  false_positives: string[];
  allow: string[];
  block: string[];
};

export type PhoneticDriverConfig = {
  phonemes: number;
  min_word_length: number;
  max_distance_ratio: number;
  supported_languages: string[];
  false_positives: string[];
};

export type PipelineDriverConfig = {
  drivers: string[];
};

export type BlaspConfig = {
  default: string;
  language: string;
  default_language: string;
  mask: string;
  mask_character: string;
  severity: Severity | string;
  events: boolean;
  cache: {
    enabled: boolean;
    driver: string | null;
    ttl: number;
    results: boolean;
    max_tracked_keys?: number;
  };
  cache_driver: string | null;
  middleware: {
    action: string;
    fields: string[];
    except: string[];
    severity: string;
  };
  model: { mode: string };
  drivers: {
    pipeline: PipelineDriverConfig;
    phonetic: PhoneticDriverConfig;
  };
} & BlaspGlobalPartial;

export type LanguageFileJson = {
  profanities: string[];
  false_positives?: string[];
  severity?: Record<string, string[]>;
  substitutions?: Record<string, string[]>;
};
