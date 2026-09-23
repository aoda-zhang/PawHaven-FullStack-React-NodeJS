import { describe, expect, it } from 'vitest';

import { RenderPdfBodySchema } from './Document.schema.js';

const issueText = (input: unknown) => {
  const result = RenderPdfBodySchema.safeParse(input);
  return result.success ? '' : JSON.stringify(result.error?.issues);
};

const canonicalBody = (template: string, locale: string) => ({
  template,
  locale,
  data: {},
});

describe('RenderPdfBodySchema', () => {
  it('accepts a canonical body for every guide slug', () => {
    for (const template of [
      'rescueGuide',
      'firstAid',
      'kittenCare',
      'injuryResponse',
    ]) {
      const result = RenderPdfBodySchema.safeParse(
        canonicalBody(template, 'en-US'),
      );

      expect(result.success, template).toBe(true);
    }
  });

  it('accepts a body carrying options', () => {
    const result = RenderPdfBodySchema.safeParse({
      ...canonicalBody('rescueGuide', 'zh-CN'),
      options: { format: 'A4', margin: { top: '20mm' } },
    });

    expect(result.success).toBe(true);
  });

  it('accepts non translatable provenance data', () => {
    const result = RenderPdfBodySchema.safeParse({
      ...canonicalBody('firstAid', 'de-DE'),
      data: { provenance: { source: 'PawHaven veterinary board' } },
    });

    expect(result.success).toBe(true);
  });

  it('rejects copy fields placed next to data', () => {
    expect(
      RenderPdfBodySchema.safeParse({
        ...canonicalBody('rescueGuide', 'en-US'),
        copy: { title: 'Animal Rescue Basics' },
      }).success,
    ).toBe(false);
  });

  it('rejects a non canonical template', () => {
    for (const template of ['rescue_guide', 'RescueGuide', 'knowledge', '']) {
      expect(
        RenderPdfBodySchema.safeParse(canonicalBody(template, 'en-US')).success,
        template,
      ).toBe(false);
    }
  });

  it('rejects a non canonical locale', () => {
    for (const locale of ['en', 'zh', 'de', 'fr-FR', '']) {
      expect(
        RenderPdfBodySchema.safeParse(canonicalBody('rescueGuide', locale))
          .success,
        locale,
      ).toBe(false);
    }
  });

  it('rejects options that the shared options schema refuses', () => {
    expect(
      issueText({
        ...canonicalBody('kittenCare', 'en-US'),
        options: { scale: 5 },
      }),
    ).toContain('scale');
    expect(
      issueText({
        ...canonicalBody('kittenCare', 'en-US'),
        options: { margin: { top: '10pt' } },
      }),
    ).toContain('margin');
  });
});
