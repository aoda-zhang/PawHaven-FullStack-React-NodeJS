import { createZodDto } from 'nestjs-zod';
import { CredentialsSchema } from '@pawhaven/shared/types';

export class RegisterDTO extends createZodDto(CredentialsSchema) {}
