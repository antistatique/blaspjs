import type { Blasp } from './blasp.js';
import { analyze } from './core/analyzer.js';
import type { MaskStrategy } from './core/contracts/maskStrategy.js';
import { Dictionary } from './core/dictionary.js';
import { CallbackMask } from './core/masking/callbackMask.js';
import { CharacterMask } from './core/masking/characterMask.js';
import { GrawlixMask } from './core/masking/grawlixMask.js';
import { Result } from './core/result.js';
import { PipelineDriver } from './drivers/pipelineDriver.js';
import type { Severity as SeverityT } from './enums/severity.js';

function cacheKeyHash(parts: unknown): string {
  const s = JSON.stringify(parts);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(16)}`;
}

export class PendingCheck {
  private driverName: string | null = null;
  private languages: string[] = [];
  private useAllLanguages = false;
  private maskStrategy: MaskStrategy | null = null;
  private allowList: string[] = [];
  private blockList: string[] = [];
  private minimumSeverity: SeverityT | null = null;
  private strictMode = false;
  private lenientMode = false;
  private pipelineDrivers: string[] | null = null;

  constructor(private readonly blasp: Blasp) {}

  driver(name: string): this {
    this.driverName = name;
    return this;
  }

  in(...langs: string[]): this {
    this.languages = langs;
    return this;
  }

  inAllLanguages(): this {
    this.useAllLanguages = true;
    return this;
  }

  mask(mask: string | ((word: string, length: number) => string)): this {
    if (typeof mask === 'function') {
      this.maskStrategy = new CallbackMask(mask);
    } else if (mask === 'grawlix') {
      this.maskStrategy = new GrawlixMask();
    } else {
      this.maskStrategy = new CharacterMask(mask);
    }
    return this;
  }

  allow(...words: string[]): this {
    this.allowList.push(...words);
    return this;
  }

  block(...words: string[]): this {
    this.blockList.push(...words);
    return this;
  }

  withSeverity(severity: SeverityT): this {
    this.minimumSeverity = severity;
    return this;
  }

  strict(): this {
    this.strictMode = true;
    this.lenientMode = false;
    return this;
  }

  lenient(): this {
    this.lenientMode = true;
    this.strictMode = false;
    return this;
  }

  pipeline(...drivers: string[]): this {
    this.pipelineDrivers = drivers;
    return this;
  }

  maskWith(character: string): this {
    return this.mask(character);
  }

  /** @deprecated Use inAllLanguages() */
  allLanguages(): this {
    return this.inAllLanguages();
  }

  language(lang: string): this {
    return this.in(lang);
  }

  english(): this {
    return this.in('english');
  }

  spanish(): this {
    return this.in('spanish');
  }

  german(): this {
    return this.in('german');
  }

  french(): this {
    return this.in('french');
  }

  configure(profanities?: string[] | null): this {
    if (profanities !== null && profanities !== undefined) {
      this.blockList.push(...profanities);
    }
    return this;
  }

  check(text: string | null | undefined): Result {
    const t = text ?? '';
    if (this.shouldCache()) {
      const cacheKey = this.buildCacheKey(t);
      const cache = this.blasp.getCache();
      const ttl = this.blasp.getConfig().cache.ttl;
      const cached = cache?.get(`blasp_result_${cacheKey}`) ?? null;
      if (cached !== null) {
        try {
          const data = JSON.parse(cached) as Record<string, unknown>;
          return Result.fromArray(data);
        } catch {
          /* fall through */
        }
      }
      const result = this.performCheck(t);
      cache?.set(`blasp_result_${cacheKey}`, JSON.stringify(result.toArray()), ttl);
      return result;
    }
    return this.performCheck(t);
  }

  checkMany(texts: string[]): Result[];
  checkMany(texts: Record<string, string>): Record<string, Result>;
  checkMany(texts: string[] | Record<string, string>): Result[] | Record<string, Result> {
    if (Array.isArray(texts)) {
      return texts.map(text => this.check(text));
    }
    const out: Record<string, Result> = {};
    for (const key of Object.keys(texts)) {
      out[key] = this.check(texts[key]!);
    }
    return out;
  }

  private performCheck(text: string): Result {
    const dictionary = this.buildDictionary();
    const driver = this.resolveDriver();
    const mask = this.resolveMask();
    const options = this.minimumSeverity !== null ? { severity: this.minimumSeverity } : ({} as { severity?: SeverityT });

    const result = analyze(text, driver, dictionary, mask, options);

    if (result.isOffensive()) {
      this.blasp.getOnProfanityDetected()?.(result, text);
    }

    return result;
  }

  private buildDictionary(): Dictionary {
    const cfg = this.blasp.getConfig();
    const effectiveAllow = [...cfg.allow, ...this.allowList];
    const effectiveBlock = [...cfg.block, ...this.blockList];
    const opts = { allow: effectiveAllow, block: effectiveBlock };

    const cacheKey = this.buildDictionaryCacheKey(cfg, effectiveAllow, effectiveBlock);
    const cached = this.blasp.getDictionaryFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    if (this.useAllLanguages) {
      const d = Dictionary.forAllLanguages(cfg, opts);
      this.blasp.setDictionaryInCache(cacheKey, d);
      return d;
    }
    if (this.languages.length > 0) {
      if (this.languages.length === 1) {
        const d = Dictionary.forLanguage(this.languages[0]!, cfg, opts);
        this.blasp.setDictionaryInCache(cacheKey, d);
        return d;
      }
      const d = Dictionary.forLanguages(this.languages, cfg, opts);
      this.blasp.setDictionaryInCache(cacheKey, d);
      return d;
    }

    const defaultLanguage = cfg.language || cfg.default_language || 'english';
    const d = Dictionary.forLanguage(defaultLanguage, cfg, opts);
    this.blasp.setDictionaryInCache(cacheKey, d);
    return d;
  }

  private buildDictionaryCacheKey(
    cfg: ReturnType<Blasp['getConfig']>,
    effectiveAllow: string[],
    effectiveBlock: string[]
  ): string {
    const languagesKey = this.useAllLanguages
      ? '__all__'
      : this.languages.length > 0
        ? [...this.languages]
            .map(l => l.trim().toLowerCase())
            .sort()
            .join(',')
        : String((cfg.language || cfg.default_language || 'english').trim().toLowerCase());

    const allowKey = [...effectiveAllow].map(w => w.toLowerCase()).sort();
    const blockKey = [...effectiveBlock].map(w => w.toLowerCase()).sort();

    // Include the config parts that affect expression generation.
    const configKey = cacheKeyHash({
      separators: cfg.separators,
      substitutions: cfg.substitutions,
    });

    return cacheKeyHash({
      languages: languagesKey,
      allow: allowKey,
      block: blockKey,
      config: configKey,
    });
  }

  private resolveDriver() {
    if (this.pipelineDrivers !== null) {
      const resolved = this.pipelineDrivers.map(name => this.blasp.resolveDriver(name));
      return new PipelineDriver(resolved);
    }

    let driverName = this.driverName ?? this.blasp.getConfig().default;
    if (this.lenientMode) {
      driverName = 'pattern';
    }

    return this.blasp.resolveDriver(driverName);
  }

  private resolveMask(): MaskStrategy {
    if (this.maskStrategy !== null) {
      return this.maskStrategy;
    }
    const maskConfig = this.blasp.getConfig().mask || this.blasp.getConfig().mask_character || '*';
    return new CharacterMask(maskConfig);
  }

  private maskKeyForCache(): string {
    if (this.maskStrategy !== null) {
      return this.maskStrategy.cacheKey();
    }
    const cfg = this.blasp.getConfig();
    const m = cfg.mask ?? cfg.mask_character ?? '*';
    if (m === 'grawlix') {
      return 'grawlix';
    }
    return `char:${m}`;
  }

  private shouldCache(): boolean {
    const cfg = this.blasp.getConfig();
    if (!cfg.cache.enabled || !cfg.cache.results) {
      return false;
    }
    if (this.maskStrategy instanceof CallbackMask) {
      return false;
    }
    return this.blasp.getCache() !== null;
  }

  private buildCacheKey(text: string): string {
    const cfg = this.blasp.getConfig();
    const parts = {
      text,
      driver: this.driverName ?? cfg.default,
      pipeline: this.pipelineDrivers,
      languages: this.languages,
      all_languages: this.useAllLanguages,
      allow: this.allowList,
      block: this.blockList,
      severity: this.minimumSeverity,
      strict: this.strictMode,
      lenient: this.lenientMode,
      mask: this.maskKeyForCache(),
    };
    return cacheKeyHash(parts);
  }
}
