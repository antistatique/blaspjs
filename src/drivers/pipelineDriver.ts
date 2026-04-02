import type { DetectOptions, Driver } from '../core/contracts/driver.js';
import type { MaskStrategy } from '../core/contracts/maskStrategy.js';
import { Dictionary } from '../core/dictionary.js';
import type { MatchedWord } from '../core/matchedWord.js';
import { Result } from '../core/result.js';
import { calculateScore } from '../core/score.js';
import { cpSlice } from '../core/utf8.js';

export class PipelineDriver implements Driver {
  constructor(private readonly drivers: Driver[]) {}

  detect(text: string, dictionary: Dictionary, mask: MaskStrategy, options: DetectOptions = {}): Result {
    if (!text) {
      return new Result(text ?? '', text ?? '', [], 0);
    }

    const allMatches: MatchedWord[] = [];
    for (const driver of this.drivers) {
      const result = driver.detect(text, dictionary, mask, options);
      allMatches.push(...result.words());
    }

    if (allMatches.length === 0) {
      return new Result(text, text, [], 0);
    }

    allMatches.sort((a, b) => (a.position !== b.position ? a.position - b.position : b.length - a.length));

    const kept: MatchedWord[] = [];
    for (const match of allMatches) {
      let overlaps = false;
      for (const existing of kept) {
        const existingEnd = existing.position + existing.length;
        const matchEnd = match.position + match.length;
        if (match.position < existingEnd && matchEnd > existing.position) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        kept.push(match);
      }
    }

    let cleanText = text;
    const reversed = [...kept].reverse();
    for (const m of reversed) {
      const replacement = mask.mask(m.text, m.length);
      cleanText = cpSlice(cleanText, 0, m.position) + replacement + cpSlice(cleanText, m.position + m.length);
    }

    const totalWords = Math.max(
      1,
      text
        .trim()
        .split(/\s+/u)
        .filter(t => t.length > 0).length
    );
    const scoreValue = calculateScore(kept, totalWords);

    return new Result(text, cleanText, kept, scoreValue);
  }
}
