import type { DetectOptions, Driver } from '../core/contracts/driver.js';
import type { MaskStrategy } from '../core/contracts/maskStrategy.js';
import { Dictionary } from '../core/dictionary.js';
import { MatchedWord } from '../core/matchedWord.js';
import { CompoundWordDetector } from '../core/matchers/compoundWordDetector.js';
import { FalsePositiveFilter } from '../core/matchers/falsePositiveFilter.js';
import { Result } from '../core/result.js';
import { calculateScore } from '../core/score.js';
import { collapseWhitespace, cpSlice, textEncoder, utf16OffsetToCpIndex, utf16RangeToCpLength } from '../core/utf8.js';
import { severityIsAtLeast } from '../enums/severity.js';
import type { Severity } from '../enums/severity.js';

export class RegexDriver implements Driver {
  detect(text: string, dictionary: Dictionary, mask: MaskStrategy, options: DetectOptions = {}): Result {
    if (!text) {
      return new Result(text ?? '', text ?? '', [], 0);
    }

    const filter = new FalsePositiveFilter(dictionary.getFalsePositives());
    const compoundDetector = new CompoundWordDetector();

    let profanityExpressions = new Map(dictionary.getProfanityExpressions());
    profanityExpressions = new Map(
      [...profanityExpressions.entries()].sort((a, b) => textEncoder.encode(b[0]).length - textEncoder.encode(a[0]).length)
    );

    const normalizer = dictionary.getNormalizer();
    let normalizedString = collapseWhitespace(normalizer.normalize(text));
    const immutableNormalized = normalizedString;

    const matchedWords: MatchedWord[] = [];
    let continueOuter = true;
    const maskedRanges: [number, number][] = [];

    while (continueOuter) {
      continueOuter = false;
      normalizedString = collapseWhitespace(normalizedString);

      for (const [profanity, expression] of profanityExpressions) {
        const flags = expression.flags.includes('g') ? expression.flags : `${expression.flags}g`;
        const re = new RegExp(expression.source, flags);
        const all = [...normalizedString.matchAll(re)];

        for (const m of all) {
          if (m.index === undefined) {
            continue;
          }
          const matchedText = m[0];
          const utf16Start = m.index;
          const byteStart = textEncoder.encode(normalizedString.slice(0, utf16Start)).length;
          const byteLength = textEncoder.encode(matchedText).length;

          const start = utf16OffsetToCpIndex(normalizedString, utf16Start);
          const length = utf16RangeToCpLength(normalizedString, utf16Start, utf16Start + matchedText.length);
          const matchEnd = start + length;

          let alreadyMasked = false;
          for (const [mStart, mEnd] of maskedRanges) {
            if (start < mEnd && matchEnd > mStart) {
              alreadyMasked = true;
              break;
            }
          }
          if (alreadyMasked) {
            continue;
          }

          if (filter.isSpanningWordBoundary(matchedText, normalizedString, byteStart)) {
            continue;
          }

          if (filter.isInsideHexToken(normalizedString, byteStart, byteLength)) {
            continue;
          }

          const fullWord = filter.getFullWordContext(normalizedString, byteStart, byteLength);
          const originalFullWord = filter.getFullWordContext(immutableNormalized, byteStart, byteLength);
          if (compoundDetector.isPureAlphaSubstring(matchedText, originalFullWord, profanity, profanityExpressions)) {
            continue;
          }

          if (filter.isFalsePositive(fullWord)) {
            continue;
          }

          continueOuter = true;

          normalizedString =
            cpSlice(normalizedString, 0, start) + '\x01'.repeat(length) + cpSlice(normalizedString, start + length);

          maskedRanges.push([start, matchEnd]);

          const originalMatchText = cpSlice(text, start, length);

          matchedWords.push(
            new MatchedWord(
              originalMatchText,
              profanity,
              dictionary.getSeverity(profanity),
              start,
              length,
              dictionary.getLanguage()
            )
          );
        }
      }
    }

    const minimumSeverity = options.severity;
    let filtered = matchedWords;
    if (minimumSeverity !== undefined) {
      filtered = matchedWords.filter(w => severityIsAtLeast(w.severity as Severity, minimumSeverity));
    }

    let workingCleanString = text;
    const sorted = [...filtered].sort((a, b) => b.position - a.position);
    for (const word of sorted) {
      const replacement = mask.mask(word.text, word.length);
      workingCleanString =
        cpSlice(workingCleanString, 0, word.position) + replacement + cpSlice(workingCleanString, word.position + word.length);
    }

    const totalWords = Math.max(
      1,
      text
        .trim()
        .split(/\s+/u)
        .filter(t => t.length > 0).length
    );
    const scoreValue = calculateScore(filtered, totalWords);

    return new Result(text, workingCleanString, filtered, scoreValue);
  }
}
