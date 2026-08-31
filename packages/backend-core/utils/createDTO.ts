import { createZodDto } from 'nestjs-zod';
import type { ZodType } from 'zod';
import type { Type } from '@nestjs/common';

/**
 * Creates a NestJS DTO class from a Zod schema.
 * Wraps nestjs-zod's createZodDto for consistent DTO generation from Zod schemas.
 *
 * @param schema - The Zod schema to convert into a DTO class
 * @returns A NestJS-compatible DTO class with Zod validation
 */
export function createDTO<TSchema extends ZodType<unknown>>(
  schema: TSchema,
): Type<unknown> {
  return createZodDto(schema);
}
