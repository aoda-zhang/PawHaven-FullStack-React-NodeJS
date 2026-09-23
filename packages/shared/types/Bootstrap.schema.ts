import { z } from 'zod';

import { MenuItemSchema } from './Menu.schema.js';

export const BootstrapDataSchema = z.object({
  menus: MenuItemSchema.array(),
  permissions: z.string().array(),
});

export type BootstrapData = z.infer<typeof BootstrapDataSchema>;
