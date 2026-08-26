import { createZodDto } from 'nestjs-zod';
import { AnimalReportSchema } from '@pawhaven/shared/types';

export class CreateReportAnimalDto extends createZodDto(AnimalReportSchema) {}
