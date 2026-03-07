import { createZodDto } from 'nestjs-zod';
import { RefreshSchema } from '@pawhaven/shared/types';

export class RefreshDTO extends createZodDto(RefreshSchema) {}
