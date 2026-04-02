export const textEncoder = new TextEncoder();
const encoder = textEncoder;
const decoder = new TextDecoder();

/** Code point count (PHP mb_strlen UTF-8 style). */
export function cpLen(s: string): number {
  return [...s].length;
}

export function cpSlice(s: string, start: number, length?: number): string {
  const arr = [...s];
  if (length === undefined) {
    return arr.slice(start).join('');
  }
  return arr.slice(start, start + length).join('');
}

export function utf16IndexToUtf8ByteOffset(s: string, utf16Index: number): number {
  return encoder.encode(s.slice(0, utf16Index)).length;
}

export function utf8ByteOffsetToCpIndex(bytes: Uint8Array, byteOffset: number): number {
  return cpLen(decoder.decode(bytes.subarray(0, byteOffset)));
}

export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ');
}

export function utf8ByteLength(s: string): number {
  return encoder.encode(s).length;
}

/** ES RegExp `index` is UTF-16; convert to code point index (PHP mb_ style). */
export function utf16OffsetToCpIndex(s: string, utf16Index: number): number {
  let cp = 0;
  let i = 0;
  while (i < utf16Index && i < s.length) {
    const c = s.charCodeAt(i);
    i += c >= 0xd800 && c <= 0xdbff ? 2 : 1;
    cp++;
  }
  return cp;
}

export function utf16RangeToCpLength(s: string, utf16Start: number, utf16End: number): number {
  return utf16OffsetToCpIndex(s, utf16End) - utf16OffsetToCpIndex(s, utf16Start);
}
