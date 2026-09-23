import { z } from 'zod';

export const guideLocales = ['en-US', 'zh-CN', 'de-DE'] as const;
export const GuideLocaleSchema = z.enum(guideLocales);
export type GuideLocale = z.infer<typeof GuideLocaleSchema>;

export const guideSlugs = [
  'rescueGuide',
  'firstAid',
  'kittenCare',
  'injuryResponse',
] as const;
export const GuideSlugSchema = z.enum(guideSlugs);
export type GuideSlug = z.infer<typeof GuideSlugSchema>;

export const guideCategories = ['rescue', 'medical', 'care'] as const;
export const GuideCategorySchema = z.enum(guideCategories);
export type GuideCategory = z.infer<typeof GuideCategorySchema>;

export const guideSurfaces = ['pdf'] as const;
export const GuideSurfaceSchema = z.enum(guideSurfaces);
export type GuideSurface = z.infer<typeof GuideSurfaceSchema>;

export const guideProvenanceSchema = z.object({
  source: z.string(),
  url: z.string().optional(),
  reviewedAt: z.string().optional(),
});
export type GuideProvenance = z.infer<typeof guideProvenanceSchema>;

export const guideCatalogItemSchema = z.object({
  slug: GuideSlugSchema,
  title: z.string(),
  description: z.string(),
  category: GuideCategorySchema,
  fileName: z.string(),
  locales: z.array(GuideLocaleSchema),
  surfaces: z.array(GuideSurfaceSchema),
});
export type GuideCatalogItem = z.infer<typeof guideCatalogItemSchema>;

export const guideCatalogSchema = z.array(guideCatalogItemSchema);
export type GuideCatalog = z.infer<typeof guideCatalogSchema>;

export const guideDocumentSchema = z.object({
  slug: GuideSlugSchema,
  fileName: z.string(),
  locales: z.array(GuideLocaleSchema),
});
export const GuideDocumentsSchema = z.array(guideDocumentSchema);
export type GuideDocument = z.infer<typeof guideDocumentSchema>;

export const normalizeLocale = (locale?: string): GuideLocale =>
  (guideLocales as readonly string[]).includes(locale ?? '')
    ? (locale as GuideLocale)
    : guideLocales[0];
