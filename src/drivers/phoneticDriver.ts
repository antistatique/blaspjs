import type { DetectOptions, Driver } from '../core/contracts/driver.js';
import type { MaskStrategy } from '../core/contracts/maskStrategy.js';
import { Dictionary } from '../core/dictionary.js';
import { MatchedWord } from '../core/matchedWord.js';
import { FalsePositiveFilter } from '../core/matchers/falsePositiveFilter.js';
import { PhoneticMatcher } from '../core/matchers/phoneticMatcher.js';
import { Result } from '../core/result.js';
import { calculateScore } from '../core/score.js';
import { cpSlice, textEncoder, utf16OffsetToCpIndex, utf16RangeToCpLength } from '../core/utf8.js';
import { severityIsAtLeast } from '../enums/severity.js';
import type { Severity } from '../enums/severity.js';

export type PhoneticDriverOptions = {
  phonemes?: number;
  minWordLength?: number;
  maxDistanceRatio?: number;
  phoneticFalsePositives?: string[];
  supportedLanguages?: string[];
};

export class PhoneticDriver implements Driver {
  private readonly phonemes: number;
  private readonly minWordLength: number;
  private readonly maxDistanceRatio: number;
  private readonly phoneticFalsePositives: string[];
  private readonly supportedLanguages: string[];

  constructor(opts: PhoneticDriverOptions = {}) {
    this.phonemes = opts.phonemes ?? 4;
    this.minWordLength = opts.minWordLength ?? 3;
    this.maxDistanceRatio = opts.maxDistanceRatio ?? 0.6;
    this.phoneticFalsePositives = opts.phoneticFalsePositives ?? [];
    this.supportedLanguages = (opts.supportedLanguages ?? ['english']).map(l => l.toLowerCase());
  }

  detect(text: string, dictionary: Dictionary, mask: MaskStrategy, options: DetectOptions = {}): Result {
    if (!text) {
      return new Result(text ?? '', text ?? '', [], 0);
    }

    const language = dictionary.getLanguage();
    const languages = language.split(',').map(l => l.trim().toLowerCase());
    const supported = new Set(this.supportedLanguages.map(l => l.toLowerCase()));
    const isSupported = languages.some(lang => supported.has(lang));
    if (!isSupported) {
      return new Result(text, text, [], 0);
    }

    const filter = new FalsePositiveFilter(dictionary.getFalsePositives());
    const matcher = new PhoneticMatcher(
      dictionary.getProfanities(),
      this.phonemes,
      this.minWordLength,
      this.maxDistanceRatio,
      this.phoneticFalsePositives
    );

    const normalizer = dictionary.getNormalizer();
    const normalized = normalizer.normalize(text);

    const tokenRe = /\b[\w']+\b/gu;
    const matchedWords: MatchedWord[] = [];

    for (const m of normalized.matchAll(tokenRe)) {
      if (m.index === undefined) {
        continue;
      }
      const word = m[0];
      const utf16Start = m.index;
      const byteStart = textEncoder.encode(normalized.slice(0, utf16Start)).length;
      const byteLength = textEncoder.encode(word).length;
      const start = utf16OffsetToCpIndex(normalized, utf16Start);
      const length = utf16RangeToCpLength(normalized, utf16Start, utf16Start + word.length);

      if (filter.isFalsePositive(word)) {
        continue;
      }

      if (filter.isInsideHexToken(normalized, byteStart, byteLength)) {
        continue;
      }

      const baseWord = matcher.match(word);
      if (baseWord === null) {
        continue;
      }

      const originalWord = cpSlice(text, start, length);

      matchedWords.push(
        new MatchedWord(originalWord, baseWord, dictionary.getSeverity(baseWord), start, length, dictionary.getLanguage())
      );
    }

    const minimumSeverity = options.severity;
    let filtered = matchedWords;
    if (minimumSeverity !== undefined) {
      filtered = matchedWords.filter(w => severityIsAtLeast(w.severity as Severity, minimumSeverity));
    }

    let cleanText = text;
    const sorted = [...filtered].sort((a, b) => b.position - a.position);
    for (const w of sorted) {
      const replacement = mask.mask(w.text, w.length);
      cleanText = cpSlice(cleanText, 0, w.position) + replacement + cpSlice(cleanText, w.position + w.length);
    }

    const totalWords = Math.max(
      1,
      text
        .trim()
        .split(/\s+/u)
        .filter(t => t.length > 0).length
    );
    const scoreValue = calculateScore(filtered, totalWords);

    return new Result(text, cleanText, filtered, scoreValue);
  }
}
