import { cpLen, cpSlice } from './utf8.js';

const SEPARATOR_PLACEHOLDER = '{!!}';
const ESCAPED_SEPARATOR_CHARACTERS = ['\\s'];

export class RegexMatcher {
  generateExpressions(profanities: string[], separators: string[], substitutions: Record<string, string[]>): Map<string, RegExp> {
    const separatorExpression = this.generateSeparatorExpression(separators);
    const substitutionExpressions = this.generateSubstitutionExpressions(substitutions);
    const profanityExpressions = new Map<string, RegExp>();

    for (const profanity of profanities) {
      profanityExpressions.set(
        profanity,
        this.generateProfanityExpression(profanity, substitutionExpressions, separatorExpression)
      );
    }

    return profanityExpressions;
  }

  generateSeparatorExpression(separators: string[]): string {
    const normalSeparators = separators.filter(sep => sep !== '.');
    const pattern = this.generateEscapedExpression(normalSeparators, ESCAPED_SEPARATOR_CHARACTERS, '');
    return `(?:${pattern}|\\.(?=\\w)){0,3}?`;
  }

  generateSubstitutionExpressions(substitutions: Record<string, string[]>): Map<string, string> {
    const characterExpressions = new Map<string, string>();

    for (const [character, substitutionOptions] of Object.entries(substitutions)) {
      let hasMultiChar = false;
      for (const option of substitutionOptions) {
        if (cpLen(option) > 1 && !/^\\.$/u.test(option)) {
          hasMultiChar = true;
          break;
        }
      }

      if (hasMultiChar) {
        // Alternatives are outside a character class — escape like preg_quote (e.g. `*` must not be a quantifier).
        const escaped = substitutionOptions.map(opt => {
          if (/^\\.$/u.test(opt)) {
            return opt;
          }
          return this.escapeRegexSource(opt);
        });
        characterExpressions.set(character, `(?:${escaped.join('|')})+${SEPARATOR_PLACEHOLDER}`);
      } else {
        characterExpressions.set(
          character,
          `${this.generateEscapedExpression(substitutionOptions, [], '+')}${SEPARATOR_PLACEHOLDER}`
        );
      }
    }

    return characterExpressions;
  }

  generateProfanityExpression(
    profanity: string,
    substitutionExpressions: Map<string, string>,
    separatorExpression: string
  ): RegExp {
    const plainSubstitutions: Record<string, string> = {};
    for (const [pattern, replacement] of substitutionExpressions) {
      const plainKey = pattern.replace(/^\/|\/$/g, '');
      plainSubstitutions[plainKey] = replacement;
    }

    const sortedKeys = Object.keys(plainSubstitutions).sort((a, b) => cpLen(b) - cpLen(a));

    let expression = '';
    let i = 0;
    const len = cpLen(profanity);

    while (i < len) {
      let matched = false;
      for (const key of sortedKeys) {
        const replacement = plainSubstitutions[key]!;
        const keyLen = cpLen(key);
        if (i + keyLen <= len && cpSlice(profanity, i, keyLen) === key) {
          expression += replacement;
          i += keyLen;
          matched = true;
          break;
        }
      }
      if (!matched) {
        expression += this.escapeRegexSource(cpSlice(profanity, i, 1));
        i++;
      }
    }

    expression = expression.split(SEPARATOR_PLACEHOLDER).join(separatorExpression);
    return new RegExp(expression, 'giu');
  }

  private escapeRegexSource(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeRegexClass(s: string): string {
    return s.replace(/[\\^\-[\]]/g, '\\$&');
  }

  private generateEscapedExpression(characters: string[] = [], escapedCharacters: string[] = [], quantifier: string): string {
    const parts = [...escapedCharacters];
    for (const character of characters) {
      parts.push(this.escapeRegexClass(character));
    }
    return `[${parts.join('')}]${quantifier}`;
  }
}
