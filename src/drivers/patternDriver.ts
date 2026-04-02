import type { DetectOptions, Driver } from '../core/contracts/driver.js';
import type { MaskStrategy } from '../core/contracts/maskStrategy.js';
import { Dictionary } from '../core/dictionary.js';
import { MatchedWord } from '../core/matchedWord.js';
import { Result } from '../core/result.js';
import { calculateScore } from '../core/score.js';
import { cpLen, cpSlice, utf16OffsetToCpIndex, utf16RangeToCpLength } from '../core/utf8.js';
import { severityIsAtLeast } from '../enums/severity.js';
import type { Severity } from '../enums/severity.js';

export class PatternDriver implements Driver {
  detect(text: string, dictionary: Dictionary, mask: MaskStrategy, options: DetectOptions = {}): Result {
    if (!text) {
      return new Result(text ?? '', text ?? '', [], 0);
    }

    const matchedWords: MatchedWord[] = [];
    const lowerText = text.toLowerCase();
    const profanities = [...dictionary.getProfanities()].sort((a, b) => cpLen(b) - cpLen(a));
    const falsePositives = new Set(dictionary.getFalsePositives().map(fp => fp.toLowerCase()));

    for (const profanity of profanities) {
      const lowerProfanity = profanity.toLowerCase();
      const escaped = lowerProfanity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'giu');
      const all = [...lowerText.matchAll(re)];

      for (const m of all) {
        if (m.index === undefined) {
          continue;
        }

        if (falsePositives.has(lowerProfanity)) {
          continue;
        }

        const start = utf16OffsetToCpIndex(lowerText, m.index);
        const length = utf16RangeToCpLength(lowerText, m.index, m.index + m[0].length);
        const originalMatch = cpSlice(text, start, length);

        matchedWords.push(
          new MatchedWord(originalMatch, profanity, dictionary.getSeverity(profanity), start, length, dictionary.getLanguage())
        );
      }
    }

    const minimumSeverity = options.severity;
    let filtered = matchedWords;
    if (minimumSeverity !== undefined) {
      filtered = matchedWords.filter(w => severityIsAtLeast(w.severity as Severity, minimumSeverity));
    }

    filtered.sort((a, b) => a.position - b.position || b.length - a.length);
    const deduplicated: MatchedWord[] = [];
    let coveredEnd = -1;
    for (const mw of filtered) {
      if (mw.position >= coveredEnd) {
        deduplicated.push(mw);
        coveredEnd = mw.position + mw.length;
      }
    }

    let cleanText = text;
    const sorted = [...deduplicated].sort((a, b) => b.position - a.position);
    for (const word of sorted) {
      const replacement = mask.mask(word.text, word.length);
      cleanText = cpSlice(cleanText, 0, word.position) + replacement + cpSlice(cleanText, word.position + word.length);
    }

    const totalWords = Math.max(
      1,
      text
        .trim()
        .split(/\s+/u)
        .filter(t => t.length > 0).length
    );
    const scoreValue = calculateScore(deduplicated, totalWords);

    return new Result(text, cleanText, deduplicated, scoreValue);
  }
}
