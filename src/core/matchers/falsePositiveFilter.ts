import { cpLen, utf8ByteOffsetToCpIndex } from '../utf8.js';

const encoder = new TextEncoder();

export class FalsePositiveFilter {
  private readonly falsePositivesMap: ReadonlySet<string>;

  constructor(falsePositives: string[]) {
    this.falsePositivesMap = new Set(falsePositives.map(w => w.toLowerCase()));
  }

  isFalsePositive(word: string): boolean {
    return this.falsePositivesMap.has(word.toLowerCase());
  }

  isInsideHexToken(str: string, start: number, length: number): boolean {
    const bytes = encoder.encode(str);
    const end = start + length;
    const strLen = bytes.length;

    let tokenStart = start;
    while (tokenStart > 0 && /[0-9a-fA-F\-]/.test(String.fromCharCode(bytes[tokenStart - 1]!))) {
      tokenStart--;
    }

    let tokenEnd = end;
    while (tokenEnd < strLen && /[0-9a-fA-F\-]/.test(String.fromCharCode(bytes[tokenEnd]!))) {
      tokenEnd++;
    }

    let token = this.bytesToAsciiString(bytes.subarray(tokenStart, tokenEnd));
    token = token.replace(/^-+|-+$/g, '').replace(/-/g, '');

    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(token)) {
      return true;
    }

    const stripped = token.replace(/-/g, '');
    if (stripped.length >= 8 && /^[0-9a-fA-F]+$/.test(stripped) && /[0-9]/.test(stripped)) {
      return true;
    }

    return false;
  }

  private bytesToAsciiString(b: Uint8Array): string {
    let s = '';
    for (let i = 0; i < b.length; i++) {
      s += String.fromCharCode(b[i]!);
    }
    return s;
  }

  /** @param matchStartByte — UTF-8 byte offset (PHP PREG_OFFSET_CAPTURE). */
  isSpanningWordBoundary(matchedText: string, fullString: string, matchStartByte: number): boolean {
    if (!/\s+/.test(matchedText)) {
      return false;
    }

    const parts = matchedText.split(/\s+/).filter(p => p.length > 0);

    if (parts.length <= 1) {
      return false;
    }

    let singleCharCount = 0;
    for (const part of parts) {
      if (cpLen(part) === 1 && /[a-z]/iu.test(part)) {
        singleCharCount++;
      }
    }

    if (singleCharCount === parts.length) {
      return false;
    }

    const fullBytes = encoder.encode(fullString);
    const matchStartChar = utf8ByteOffsetToCpIndex(fullBytes, matchStartByte);
    const matchEndChar = matchStartChar + cpLen(matchedText);

    let embeddedAtStart = false;
    let embeddedAtEnd = false;

    if (matchStartChar > 0) {
      const charBefore = [...fullString][matchStartChar - 1] ?? '';
      if (/\w/u.test(charBefore)) {
        embeddedAtStart = true;
      }
    }

    if (matchEndChar < cpLen(fullString)) {
      const charAfter = [...fullString][matchEndChar] ?? '';
      if (/\w/u.test(charAfter)) {
        embeddedAtEnd = true;
      }
    }

    if (embeddedAtStart && embeddedAtEnd) {
      return true;
    }

    if (embeddedAtStart && !embeddedAtEnd) {
      const standaloneParts = parts.slice(1);
      const standalonePortion = standaloneParts.join(' ');
      const hasLetter = /[a-z]/iu.test(standalonePortion);
      const hasNonLetter = /[^a-z\s]/iu.test(standalonePortion);
      if (hasLetter && hasNonLetter) {
        return false;
      }
      return true;
    }

    if (!embeddedAtStart && embeddedAtEnd) {
      const standaloneParts = parts.slice(0, -1);
      const standalonePortion = standaloneParts.join(' ');
      const hasLetter = /[a-z]/iu.test(standalonePortion);
      const hasNonLetter = /[^a-z\s]/iu.test(standalonePortion);
      if (hasLetter && hasNonLetter) {
        return false;
      }
      return true;
    }

    return false;
  }

  getFullWordContext(str: string, start: number, length: number): string {
    const bytes = encoder.encode(str);
    let left = start;
    let right = start + length;

    while (left > 0 && /\w/.test(String.fromCharCode(bytes[left - 1]!))) {
      left--;
    }

    while (right < bytes.length && /\w/.test(String.fromCharCode(bytes[right]!))) {
      right++;
    }

    return this.bytesToAsciiString(bytes.subarray(left, right));
  }
}
