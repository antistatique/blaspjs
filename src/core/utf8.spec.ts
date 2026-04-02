import { describe, expect, test } from 'vitest';

import {
  collapseWhitespace,
  cpLen,
  cpSlice,
  textEncoder,
  utf8ByteLength,
  utf8ByteOffsetToCpIndex,
  utf16IndexToUtf8ByteOffset,
  utf16OffsetToCpIndex,
  utf16RangeToCpLength,
} from './utf8.js';

describe('utf8 helpers', () => {
  test('cpLen counts code points', () => {
    expect(cpLen('ab')).toBe(2);
    expect(cpLen('é')).toBe(1);
    expect(cpLen('😀')).toBe(1);
  });

  test('cpSlice', () => {
    expect(cpSlice('hello', 1, 2)).toBe('el');
    expect(cpSlice('hello', 1, 3)).toBe('ell');
    expect(cpSlice('hello', 2)).toBe('llo');
  });

  test('collapseWhitespace', () => {
    expect(collapseWhitespace('a  \n\t b')).toBe('a b');
  });

  test('utf8ByteLength', () => {
    expect(utf8ByteLength('a')).toBe(1);
    expect(utf8ByteLength('é')).toBe(2);
  });

  test('utf16IndexToUtf8ByteOffset', () => {
    expect(utf16IndexToUtf8ByteOffset('hi', 1)).toBe(1);
  });

  test('utf8ByteOffsetToCpIndex full prefix', () => {
    const bytes = textEncoder.encode('hé');
    expect(utf8ByteOffsetToCpIndex(bytes, 0)).toBe(0);
    expect(utf8ByteOffsetToCpIndex(bytes, bytes.length)).toBe(2);
  });

  test('utf16OffsetToCpIndex with surrogate pair', () => {
    const s = 'a😀b';
    const iEmoji = s.indexOf('😀');
    expect(utf16OffsetToCpIndex(s, iEmoji)).toBe(1);
    expect(utf16RangeToCpLength(s, iEmoji, iEmoji + 2)).toBe(1);
  });
});
