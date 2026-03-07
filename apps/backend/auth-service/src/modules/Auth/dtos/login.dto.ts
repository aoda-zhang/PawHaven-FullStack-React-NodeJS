import { createZodDto } from 'nestjs-zod';
import { CredentialsSchema } from '@pawhaven/shared/types';

export class LoginDTO extends createZodDto(CredentialsSchema) {}
