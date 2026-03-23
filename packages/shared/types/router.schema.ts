import { z } from 'zod';

/**
 * Router meta information used by frontend & backend.
 * This is intentionally simple and data-driven.
 */
export interface RouterHandle {
  isMenuAvailable?: boolean;
  isFooterAvailable?: boolean;
  isLazyLoad?: boolean;
}

export interface RouterItem {
  element: string;
  path: string | null;
  children?: RouterItem[];
  handle: RouterHandle;
}

/**
 * Zod schemas
 */
const HandleSchema = z
  .object({
    isMenuAvailable: z.boolean().optional(),
    isFooterAvailable: z.boolean().optional(),
    isLazyLoad: z.boolean().optional(),
  })
  .default({});

export const RouterItemSchema: z.ZodType<RouterItem> = z.lazy(() =>
  z.object({
    element: z.string(),
    path: z.string().nullable().default(null),
    children: z.array(RouterItemSchema).default([]),
    handle: HandleSchema.default({}),
    parentId: z.string().optional(),
  }),
);

export const RouterSchema = z.array(RouterItemSchema);

export type Router = z.infer<typeof RouterSchema>;
