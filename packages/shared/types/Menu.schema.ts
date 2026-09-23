import { z } from 'zod';

const BaseMenuSchema = z.object({
  label: z.string(),
  to: z.string().min(1),
  classNames: z.array(z.string()),
  order: z.number().int().nonnegative(),
});

export const MenuItemSchema = BaseMenuSchema.strict();

export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuSchema = z.array(MenuItemSchema);

export type Menu = z.infer<typeof MenuSchema>;
