import {
  All,
  Controller,
  HttpStatus,
  Req,
  VersioningType,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { httpHeaders } from '../constants/httpHeaders.js';

import { MiddlewareModule } from './index.module.js';

const GLOBAL_PREFIX = 'api';
const PROBE_PATH = '/api/core/home';

@Controller()
class LocaleProbeController {
  @All('*path')
  echo(@Req() req: Request): Record<string, unknown> {
    return { locale: req.headers[httpHeaders.appLocale] ?? null };
  }
}

const boot = async (): Promise<NestExpressApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [MiddlewareModule],
    controllers: [LocaleProbeController],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useLogger(false);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableVersioning({ type: VersioningType.URI });
  await app.init();

  return app;
};

describe('localeMiddleware', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('keeps a canonical x-locale unchanged', async () => {
    app = await boot();

    const response = await request(app.getHttpServer())
      .get(PROBE_PATH)
      .set(httpHeaders.appLocale, 'zh-CN');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.locale).toBe('zh-CN');
  });

  it('ignores the bare locale header', async () => {
    app = await boot();

    const response = await request(app.getHttpServer())
      .get(PROBE_PATH)
      .set('locale', 'de-DE');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.locale).toBe('en-US');
  });

  it('falls back to the first entry of accept-language', async () => {
    app = await boot();

    const response = await request(app.getHttpServer())
      .get(PROBE_PATH)
      .set(httpHeaders.acceptLanguage, 'zh-CN,zh;q=0.9');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.locale).toBe('zh-CN');
  });

  it('defaults to en-US when no locale header is present', async () => {
    app = await boot();

    const response = await request(app.getHttpServer()).get(PROBE_PATH);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.locale).toBe('en-US');
  });
});
