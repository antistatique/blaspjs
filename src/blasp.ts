import { LruCache } from './cache/lruCache.js';
import { MemoryCache } from './cache/memoryCache.js';
import type { CacheAdapter } from './cache/types.js';
import { defaultBlaspConfig, mergeBlaspConfig } from './config/defaultConfig.js';
import type { BlaspConfig } from './config/types.js';
import type { Driver } from './core/contracts/driver.js';
import type { Dictionary } from './core/dictionary.js';
import { Result } from './core/result.js';
import { PatternDriver } from './drivers/patternDriver.js';
import { PhoneticDriver } from './drivers/phoneticDriver.js';
import { PipelineDriver } from './drivers/pipelineDriver.js';
import { RegexDriver } from './drivers/regexDriver.js';
import type { Severity } from './enums/severity.js';
import { PendingCheck } from './pendingCheck.js';

export type BlaspRuntimeOptions = {
  cache?: CacheAdapter | null;
  /** Called when profanity is detected (in addition to any framework integration you add). */
  onProfanityDetected?: (result: Result, originalText: string) => void;
};

export class Blasp {
  private readonly config: BlaspConfig;
  private readonly customDrivers = new Map<string, () => Driver>();
  private readonly memoryCache = new MemoryCache();
  private readonly dictionaryCache = new LruCache<string, Dictionary>(8);
  private readonly externalCache: CacheAdapter | null | undefined;
  private readonly onProfanityDetected?: (result: Result, originalText: string) => void;

  constructor(config?: Partial<BlaspConfig>, runtime?: BlaspRuntimeOptions) {
    this.config = mergeBlaspConfig(defaultBlaspConfig, config);
    this.externalCache = runtime?.cache;
    this.onProfanityDetected = runtime?.onProfanityDetected;
  }

  getConfig(): BlaspConfig {
    return this.config;
  }

  getOnProfanityDetected(): ((result: Result, originalText: string) => void) | undefined {
    return this.onProfanityDetected;
  }

  getCache(): CacheAdapter | null {
    if (!this.config.cache.enabled) {
      return null;
    }
    if (this.externalCache === null) {
      return null;
    }
    return this.externalCache ?? this.memoryCache;
  }

  clearCaches(): void {
    this.memoryCache.clear();
    this.dictionaryCache.clear();
  }

  driver(name?: string): PendingCheck {
    const p = new PendingCheck(this);
    return name !== undefined ? p.driver(name) : p;
  }

  resolveDriver(name: string): Driver {
    const custom = this.customDrivers.get(name);
    if (custom) {
      return custom();
    }

    switch (name) {
      case 'regex':
        return new RegexDriver();
      case 'pattern':
        return new PatternDriver();
      case 'phonetic':
        return new PhoneticDriver({
          phonemes: this.config.drivers.phonetic.phonemes,
          minWordLength: this.config.drivers.phonetic.min_word_length,
          maxDistanceRatio: this.config.drivers.phonetic.max_distance_ratio,
          phoneticFalsePositives: this.config.drivers.phonetic.false_positives,
          supportedLanguages: this.config.drivers.phonetic.supported_languages,
        });
      case 'pipeline': {
        const names = this.config.drivers.pipeline.drivers.filter(n => n.trim().toLowerCase() !== 'pipeline');
        return new PipelineDriver(names.map(n => this.resolveDriver(n)));
      }
      default:
        throw new Error(`Driver [${name}] not supported.`);
    }
  }

  extend(name: string, factory: () => Driver): this {
    this.customDrivers.set(name, factory);
    return this;
  }

  newPendingCheck(): PendingCheck {
    return new PendingCheck(this);
  }

  getDictionaryFromCache(key: string): Dictionary | undefined {
    return this.dictionaryCache.get(key);
  }

  setDictionaryInCache(key: string, dictionary: Dictionary): void {
    this.dictionaryCache.set(key, dictionary);
  }

  check(text: string | null | undefined): Result {
    return this.newPendingCheck().check(text);
  }

  checkMany(texts: string[]): Result[];
  checkMany(texts: Record<string, string>): Record<string, Result>;
  checkMany(texts: string[] | Record<string, string>): Result[] | Record<string, Result> {
    const p = this.newPendingCheck();
    if (Array.isArray(texts)) {
      return p.checkMany(texts);
    }
    return p.checkMany(texts);
  }

  pipeline(...drivers: string[]): PendingCheck {
    return this.newPendingCheck().pipeline(...drivers);
  }

  in(...languages: string[]): PendingCheck {
    return this.newPendingCheck().in(...languages);
  }

  inAllLanguages(): PendingCheck {
    return this.newPendingCheck().inAllLanguages();
  }

  english(): PendingCheck {
    return this.newPendingCheck().english();
  }

  spanish(): PendingCheck {
    return this.newPendingCheck().spanish();
  }

  german(): PendingCheck {
    return this.newPendingCheck().german();
  }

  french(): PendingCheck {
    return this.newPendingCheck().french();
  }

  mask(mask: string | ((word: string, length: number) => string)): PendingCheck {
    return this.newPendingCheck().mask(mask);
  }

  maskWith(character: string): PendingCheck {
    return this.newPendingCheck().maskWith(character);
  }

  allow(...words: string[]): PendingCheck {
    return this.newPendingCheck().allow(...words);
  }

  block(...words: string[]): PendingCheck {
    return this.newPendingCheck().block(...words);
  }

  withSeverity(severity: Severity): PendingCheck {
    return this.newPendingCheck().withSeverity(severity);
  }

  strict(): PendingCheck {
    return this.newPendingCheck().strict();
  }

  lenient(): PendingCheck {
    return this.newPendingCheck().lenient();
  }
}

/** Default shared instance with library defaults. */
export const blasp = new Blasp();
