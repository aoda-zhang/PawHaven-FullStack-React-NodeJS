/* eslint-disable max-classes-per-file */
import { createZodDto } from 'nestjs-zod';
import {
  RouterHandle,
  RouterItem,
  RouterItemSchema,
} from '@pawhaven/shared/types';

export class RouterItemDTO extends createZodDto(RouterItemSchema) {
  element!: string;

  path!: string | null;

  children?: RouterItem[];

  handle!: RouterHandle;

  parentId?: string;
}
export class CreatedRouteDTO {
  element!: string;

  path!: string | null;

  handle!: unknown;
}
