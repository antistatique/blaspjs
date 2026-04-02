import type { Severity } from '../enums/severity.js';
import { severityWeight } from '../enums/severity.js';
import type { MatchedWord } from './matchedWord.js';

export function calculateScore(matchedWords: MatchedWord[], totalWordCount: number): number {
  if (matchedWords.length === 0) {
    return 0;
  }

  let rawScore = 0;
  for (const word of matchedWords) {
    rawScore += severityWeight(word.severity as Severity);
  }

  const density = matchedWords.length / Math.max(1, totalWordCount);
  const normalized = Math.trunc(rawScore * (1 + density));

  return Math.min(100, normalized);
}
