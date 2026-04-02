import { Severity, severityWeight, trySeverity } from '../enums/severity.js';
import type { Severity as SeverityT } from '../enums/severity.js';
import { MatchedWord } from './matchedWord.js';
import { calculateScore } from './score.js';
import { cpLen } from './utf8.js';

export class Result {
  private readonly matchedWords: MatchedWord[];

  constructor(
    private readonly originalText: string,
    private readonly cleanText: string,
    matchedWords: MatchedWord[],
    private readonly scoreValue: number
  ) {
    this.matchedWords = [...matchedWords];
  }

  isClean(): boolean {
    return this.matchedWords.length === 0;
  }

  isOffensive(): boolean {
    return this.matchedWords.length > 0;
  }

  clean(): string {
    return this.cleanText;
  }

  original(): string {
    return this.originalText;
  }

  score(): number {
    return this.scoreValue;
  }

  count(): number {
    return this.matchedWords.length;
  }

  uniqueWords(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const w of this.matchedWords) {
      if (!seen.has(w.base)) {
        seen.add(w.base);
        out.push(w.base);
      }
    }
    return out;
  }

  severity(): SeverityT | null {
    if (this.matchedWords.length === 0) {
      return null;
    }
    let best = this.matchedWords[0]!.severity as SeverityT;
    for (const w of this.matchedWords) {
      if (severityWeight(w.severity as SeverityT) > severityWeight(best)) {
        best = w.severity as SeverityT;
      }
    }
    return best;
  }

  words(): MatchedWord[] {
    return this.matchedWords;
  }

  hasProfanity(): boolean {
    return this.isOffensive();
  }

  getCleanString(): string {
    return this.clean();
  }

  getSourceString(): string {
    return this.original();
  }

  getProfanitiesCount(): number {
    return this.count();
  }

  getUniqueProfanitiesFound(): string[] {
    return this.uniqueWords();
  }

  static none(text: string): Result {
    return new Result(text, text, [], 0);
  }

  static fromArray(data: Record<string, unknown>): Result {
    const wordsRaw = (data.words ?? []) as Array<Record<string, unknown>>;
    const matchedWords = wordsRaw.map(
      wordData =>
        new MatchedWord(
          String(wordData.text ?? ''),
          String(wordData.base ?? ''),
          trySeverity(String(wordData.severity)) ?? Severity.High,
          Number(wordData.position ?? 0),
          Number(wordData.length ?? 0),
          String(wordData.language ?? 'english')
        )
    );

    return new Result(String(data.original ?? ''), String(data.clean ?? ''), matchedWords, Number(data.score ?? 0));
  }

  static withMatches(words: Array<string | MatchedWord>, originalText = '', cleanText = ''): Result {
    const matchedWords: MatchedWord[] = [];
    for (const word of words) {
      if (word instanceof MatchedWord) {
        matchedWords.push(word);
      } else {
        matchedWords.push(new MatchedWord(word, word, Severity.High, 0, cpLen(word), 'english'));
      }
    }

    const textForCount = originalText.trim() || words.map(w => (typeof w === 'string' ? w : w.text)).join(' ');
    const totalWords = Math.max(1, textForCount.split(/\s+/u).filter(t => t.length > 0).length);
    const score = calculateScore(matchedWords, totalWords);

    return new Result(originalText, cleanText || originalText, matchedWords, score);
  }

  toArray(): Record<string, unknown> {
    return {
      original: this.originalText,
      clean: this.cleanText,
      is_offensive: this.isOffensive(),
      score: this.scoreValue,
      count: this.count(),
      unique_words: this.uniqueWords(),
      severity: this.severity(),
      words: this.matchedWords.map(w => w.toArray()),
    };
  }

  toJson(): string {
    return JSON.stringify(this.toArray());
  }

  toString(): string {
    return this.cleanText;
  }

  get length(): number {
    return this.count();
  }

  [Symbol.iterator](): Iterator<MatchedWord> {
    return this.matchedWords.values();
  }
}
