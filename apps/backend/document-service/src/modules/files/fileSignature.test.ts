import { describe, expect, it } from 'vitest';

import { detectContentType } from './fileSignature.js';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const pdf = Buffer.from('%PDF-1.7\n');
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.alloc(4),
  Buffer.from('WEBP'),
]);

describe('detectContentType', () => {
  it.each([
    ['image/png', png],
    ['image/jpeg', jpeg],
    ['image/webp', webp],
    ['application/pdf', pdf],
  ])('detects %s from its signature', (expected, body) => {
    expect(detectContentType(body)).toBe(expected);
  });

  it('returns undefined for unknown content', () => {
    expect(detectContentType(Buffer.from('not-an-image'))).toBeUndefined();
  });

  it('returns undefined for an empty body', () => {
    expect(detectContentType(Buffer.alloc(0))).toBeUndefined();
  });
});
