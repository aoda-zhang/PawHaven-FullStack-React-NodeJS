import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

export async function setupApp(app: NestExpressApplication): Promise<void> {
  const configService = app.get(ConfigService);

  const httpPrefix = configService.get<string>('http.prefix', '');
  const corsOptions = configService.get('cors');

  // Security and CORS
  app.disable('x-powered-by');
  app.use(
    helmet({
      frameguard: { action: 'deny' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableShutdownHooks();
  app.enableCors(corsOptions);
  app.use(cookieParser());

  // Global prefix & versioning
  app.setGlobalPrefix(httpPrefix);
  app.enableVersioning({ type: VersioningType.URI });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      exceptionFactory: (errors) => {
        if (process.env.NODE_ENV === 'production') {
          return new BadRequestException('Validation failed');
        }
        return errors;
      },
    }),
  );
}
