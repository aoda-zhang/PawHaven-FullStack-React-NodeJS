import { createZodDto } from 'nestjs-zod';
import { CreateRescueDtoSchema } from '@pawhaven/shared/types';

export class CreateRescueDto extends createZodDto(CreateRescueDtoSchema) {}
