import type { BlaspConfig, LanguageFileJson } from '../config/types.js';
import { Severity, trySeverity } from '../enums/severity.js';
import type { Severity as SeverityT } from '../enums/severity.js';
import { AVAILABLE_LANGUAGES, loadLanguageConfig } from '../languages/registry.js';
import { getNormalizerForLanguage } from './normalizers/index.js';
import type { StringNormalizer } from './normalizers/types.js';
import { RegexMatcher } from './regexMatcher.js';
import { cpLen, utf8ByteLength } from './utf8.js';

export type DictionaryOptions = {
  allow?: string[];
  block?: string[];
};

export class Dictionary {
  private readonly profanities: string[];
  private readonly falsePositives: string[];
  private readonly separators: string[];
  private readonly substitutions: Record<string, string[]>;
  private readonly severityMap: Map<string, SeverityT>;
  private readonly profanityExpressions: Map<string, RegExp>;
  private readonly sortedProfanityExpressions: Array<[string, RegExp]>;
  private readonly wordBoundaryExpressions: Array<[string, RegExp]>;
  private readonly normalizer: StringNormalizer;
  private readonly allowList: string[];
  private readonly blockList: string[];
  private readonly language: string;

  constructor(
    profanities: string[],
    falsePositives: string[],
    separators: string[],
    substitutions: Record<string, string[]>,
    severityMap: Map<string, SeverityT>,
    normalizer: StringNormalizer,
    allowList: string[] = [],
    blockList: string[] = [],
    language = 'english',
    profanityExpressions: Map<string, RegExp> | null = null
  ) {
    this.falsePositives = falsePositives;
    this.separators = separators;
    this.substitutions = substitutions;
    this.normalizer = normalizer;
    this.allowList = allowList.map(w => w.toLowerCase());
    this.blockList = blockList.map(w => w.toLowerCase());
    this.language = language;

    let profs = [...profanities];
    const sevMap = new Map(severityMap);

    for (const word of this.blockList) {
      if (!profs.some(p => p.toLowerCase() === word)) {
        profs.push(word);
        sevMap.set(word, Severity.High);
      }
    }

    if (this.allowList.length > 0) {
      profs = profs.filter(p => !this.allowList.includes(p.toLowerCase()));
    }

    this.profanities = profs;
    this.severityMap = sevMap;

    this.profanityExpressions =
      profanityExpressions ?? new RegexMatcher().generateExpressions(this.profanities, this.separators, this.substitutions);

    // Longest-first helps avoid substring masking issues in some flows.
    this.sortedProfanityExpressions = [...this.profanityExpressions.entries()].sort(
      (a, b) => utf8ByteLength(b[0]) - utf8ByteLength(a[0])
    );

    // Used by PatternDriver to avoid compiling a RegExp per profanity per call.
    const escaped = (s: string) => s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.wordBoundaryExpressions = [...this.profanities]
      .sort((a, b) => cpLen(b) - cpLen(a))
      .map(p => [p, new RegExp(`\\b${escaped(p)}\\b`, 'giu')] as [string, RegExp]);
  }

  getProfanities(): string[] {
    return this.profanities;
  }

  getFalsePositives(): string[] {
    return this.falsePositives;
  }

  getProfanityExpressions(): Map<string, RegExp> {
    return this.profanityExpressions;
  }

  getSortedProfanityExpressions(): Array<[string, RegExp]> {
    return this.sortedProfanityExpressions;
  }

  getWordBoundaryExpressions(): Array<[string, RegExp]> {
    return this.wordBoundaryExpressions;
  }

  getSeverity(word: string): SeverityT {
    const lower = word.toLowerCase();
    return this.severityMap.get(lower) ?? Severity.High;
  }

  getNormalizer(): StringNormalizer {
    return this.normalizer;
  }

  getLanguage(): string {
    return this.language;
  }

  getSeparators(): string[] {
    return this.separators;
  }

  getSubstitutions(): Record<string, string[]> {
    return this.substitutions;
  }

  static forLanguage(language: string, globalConfig: BlaspConfig, options: DictionaryOptions = {}): Dictionary {
    if (!/^[a-zA-Z0-9_-]+$/.test(language)) {
      return new Dictionary([], [], [], {}, new Map(), getNormalizerForLanguage('english'), [], [], language, null);
    }

    const config = loadLanguageConfig(language);
    const profanities = config.profanities ?? [];
    const falsePositives = config.false_positives ?? [];
    const severityMap = Dictionary.buildSeverityMap(config);

    let substitutions: Record<string, string[]> = { ...globalConfig.substitutions };
    if (config.substitutions && typeof config.substitutions === 'object') {
      for (const [pattern, values] of Object.entries(config.substitutions)) {
        if (Array.isArray(values)) {
          const merged = [...(substitutions[pattern] ?? []), ...values];
          substitutions = { ...substitutions, [pattern]: [...new Set(merged)] };
        }
      }
    }

    return new Dictionary(
      profanities,
      falsePositives,
      globalConfig.separators,
      substitutions,
      severityMap,
      getNormalizerForLanguage(language),
      options.allow ?? [],
      options.block ?? [],
      language,
      null
    );
  }

  static forLanguages(languages: string[], globalConfig: BlaspConfig, options: DictionaryOptions = {}): Dictionary {
    let allProfanities: string[] = [];
    let allFalsePositives: string[] = [];
    const allSeverityMap = new Map<string, SeverityT>();
    let substitutions: Record<string, string[]> = { ...globalConfig.substitutions };

    for (const language of languages) {
      if (!/^[a-zA-Z0-9_-]+$/.test(language)) {
        continue;
      }
      const config = loadLanguageConfig(language);
      allProfanities = allProfanities.concat(config.profanities ?? []);
      allFalsePositives = allFalsePositives.concat(config.false_positives ?? []);
      const sm = Dictionary.buildSeverityMap(config);
      for (const [k, v] of sm) {
        allSeverityMap.set(k, v);
      }

      if (config.substitutions && typeof config.substitutions === 'object') {
        for (const [pattern, values] of Object.entries(config.substitutions)) {
          if (!Array.isArray(values)) continue;
          const plainKey = pattern.replace(/^\/|\/$/g, '');
          if ([...plainKey].length > 1 || /^[a-zA-Z]$/.test(plainKey)) {
            continue;
          }
          const merged = [...(substitutions[pattern] ?? []), ...values];
          substitutions = { ...substitutions, [pattern]: [...new Set(merged)] };
        }
      }
    }

    return new Dictionary(
      [...new Set(allProfanities)],
      [...new Set(allFalsePositives)],
      globalConfig.separators,
      substitutions,
      allSeverityMap,
      getNormalizerForLanguage('english'),
      options.allow ?? [],
      options.block ?? [],
      languages.join(','),
      null
    );
  }

  static forAllLanguages(globalConfig: BlaspConfig, options: DictionaryOptions = {}): Dictionary {
    return Dictionary.forLanguages(AVAILABLE_LANGUAGES, globalConfig, options);
  }

  static getAvailableLanguages(): string[] {
    return [...AVAILABLE_LANGUAGES];
  }

  private static buildSeverityMap(config: LanguageFileJson): Map<string, SeverityT> {
    const map = new Map<string, SeverityT>();

    if (config.severity && typeof config.severity === 'object') {
      for (const [level, words] of Object.entries(config.severity)) {
        const severity = trySeverity(level) ?? Severity.High;
        for (const word of words) {
          map.set(word.toLowerCase(), severity);
        }
      }
    }

    if (config.profanities) {
      for (const word of config.profanities) {
        const lower = word.toLowerCase();
        if (!map.has(lower)) {
          map.set(lower, Severity.High);
        }
      }
    }

    return map;
  }
}
