import type { Severity } from '../enums/severity.js';

export class MatchedWord {
  constructor(
    public readonly text: string,
    public readonly base: string,
    public readonly severity: Severity,
    public readonly position: number,
    public readonly length: number,
    public readonly language = 'english'
  ) {}

  toArray(): Record<string, unknown> {
    return {
      text: this.text,
      base: this.base,
      severity: this.severity,
      position: this.position,
      length: this.length,
      language: this.language,
    };
  }
}
