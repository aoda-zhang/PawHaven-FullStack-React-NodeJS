import { describe, expect, it } from 'vitest';

import { pdfMarginSchema, pdfOptionsSchema } from './Options.schema.js';

const validLengths = ['110px', '80px', '0', '20mm', '1in', '1.5cm', '12'];
const invalidLengths = ['10pt', '-5px', 'abc', '', 'px', '1.2.3px', '50 %'];

describe('pdfMarginSchema', () => {
  it('accepts every side with and without a unit', () => {
    for (const value of validLengths) {
      expect(
        pdfMarginSchema.safeParse({
          top: value,
          bottom: value,
          left: value,
          right: value,
        }).success,
        value,
      ).toBe(true);
    }
  });

  it('accepts a partial margin', () => {
    expect(pdfMarginSchema.safeParse({ top: '110px' }).success).toBe(true);
    expect(pdfMarginSchema.safeParse({}).success).toBe(true);
  });

  it('rejects length units outside the whitelist', () => {
    for (const value of invalidLengths) {
      expect(pdfMarginSchema.safeParse({ top: value }).success, value).toBe(
        false,
      );
    }
  });

  it('rejects a non string side', () => {
    expect(pdfMarginSchema.safeParse({ top: 110 }).success).toBe(false);
  });

  it('rejects an unknown side', () => {
    const result = pdfMarginSchema.safeParse({ vertical: '10px' });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('vertical');
  });
});

describe('pdfOptionsSchema', () => {
  it('accepts an empty options object', () => {
    expect(pdfOptionsSchema.safeParse({}).success).toBe(true);
  });

  it('accepts every documented field', () => {
    const result = pdfOptionsSchema.safeParse({
      format: 'A4',
      landscape: false,
      scale: 1,
      margin: { top: '110px', bottom: '80px', left: '0', right: '0' },
      printBackground: true,
      displayHeaderFooter: true,
      preferCSSPageSize: true,
    });

    expect(result.success).toBe(true);
  });

  it('accepts every declared paper format', () => {
    for (const format of ['A4', 'A3', 'A5', 'LETTER', 'LEGAL', 'TABLOID']) {
      expect(pdfOptionsSchema.safeParse({ format }).success, format).toBe(true);
    }
  });

  it('rejects a lower case paper format', () => {
    expect(pdfOptionsSchema.safeParse({ format: 'a4' }).success).toBe(false);
  });

  it('rejects an undeclared paper format', () => {
    expect(pdfOptionsSchema.safeParse({ format: 'B5' }).success).toBe(false);
  });

  it('accepts scale at both range boundaries', () => {
    expect(pdfOptionsSchema.safeParse({ scale: 0.1 }).success).toBe(true);
    expect(pdfOptionsSchema.safeParse({ scale: 2 }).success).toBe(true);
  });

  it('rejects scale outside 0.1 to 2', () => {
    expect(pdfOptionsSchema.safeParse({ scale: 0 }).success).toBe(false);
    expect(pdfOptionsSchema.safeParse({ scale: 0.09 }).success).toBe(false);
    expect(pdfOptionsSchema.safeParse({ scale: 2.01 }).success).toBe(false);
  });

  it('rejects unknown option keys instead of ignoring them', () => {
    for (const key of ['paperSize', 'headerTemplate', 'path', 'timeout']) {
      const result = pdfOptionsSchema.safeParse({ [key]: 'x' });

      expect(result.success, key).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain(key);
    }
  });

  it('rejects a bad length unit nested in the margin', () => {
    const result = pdfOptionsSchema.safeParse({ margin: { top: '10pt' } });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('margin');
  });

  it('rejects a non boolean flag', () => {
    expect(pdfOptionsSchema.safeParse({ landscape: 'yes' }).success).toBe(
      false,
    );
  });
});
