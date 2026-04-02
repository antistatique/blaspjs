const SUFFIXES = ['s', 'es', 'ed', 'er', 'ers', 'est', 'ing', 'ings', 'ly', 'y'];

export class CompoundWordDetector {
  isPureAlphaSubstring(
    matchedText: string,
    fullWord: string,
    profanityKey: string,
    profanityExpressions: Map<string, RegExp>
  ): boolean {
    if (!/^[a-zA-Z]+$/.test(matchedText)) {
      return false;
    }

    if (!/^[a-zA-Z]+$/.test(fullWord)) {
      return false;
    }

    if (fullWord.length <= matchedText.length) {
      return false;
    }

    if (matchedText.length > profanityKey.length) {
      return false;
    }

    const matchLower = matchedText.toLowerCase();
    const wordLower = fullWord.toLowerCase();

    for (const suffix of SUFFIXES) {
      if (wordLower === matchLower + suffix) {
        return false;
      }
    }

    const pos = wordLower.indexOf(matchLower);
    if (pos !== -1) {
      const remainder = wordLower.slice(0, pos) + wordLower.slice(pos + matchLower.length);
      for (const profanity of profanityExpressions.keys()) {
        if (profanity.length >= 3 && remainder.includes(profanity.toLowerCase())) {
          return false;
        }
      }
    }

    return true;
  }
}
