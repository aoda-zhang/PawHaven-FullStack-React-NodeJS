import { createZodDto } from 'nestjs-zod';
import { MenuItemSchema } from '@pawhaven/shared/types';

export class MenuItemDto extends createZodDto(MenuItemSchema) {}
