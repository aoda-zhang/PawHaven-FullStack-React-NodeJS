import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { AuthMetadataKey } from '@pawhaven/backend-core/decorators';
import { getTraceId, runWithTrace } from '@pawhaven/backend-core/trace';
import { describe, expect, it, vi } from 'vitest';

import { InternalPdfController } from './internalPdf.controller.js';

const PDF = Buffer.from('%PDF-1.4 internal render');

const buildController = (render?: () => Promise<Buffer>) => {
  const renderPdf = vi.fn(render ?? (() => Promise.resolve(PDF)));
  return {
    controller: new InternalPdfController({ renderPdf } as never),
    renderPdf,
  };
};

const createResponse = () => {
  const response = {
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    set(headers: Record<string, string>) {
      Object.assign(response.headers, headers);
    },
    end(payload: unknown) {
      response.body = payload;
    },
  };
  return response;
};

const localeHeaders = (locale: string) => ({
  [httpHeaders.appLocale]: locale,
});

const call = (
  controller: InternalPdfController,
  {
    body = { template: 'rescueGuide', locale: 'en-US' },
    headers = localeHeaders('en-US'),
  }: {
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
) => {
  const res = createResponse();
  return {
    res,
    done: controller.render(body as never, headers as never, res as never),
  };
};

describe('InternalPdfController', () => {
  it('is not marked public, so the global internal JWT guard applies', () => {
    const reflector = new Reflector();

    // Same lookup order `InternalJwtGuard` uses: handler first, then class.
    const isPublic = reflector.getAllAndOverride(AuthMetadataKey.PUBLIC, [
      InternalPdfController.prototype.render,
      InternalPdfController,
    ]);

    // A `@Public()` here would let an anonymous caller reach the renderer; the
    // gateway refusing to proxy `/internal` is only a second line of defence.
    expect(isPublic).toBeFalsy();
  });

  it('returns the rendered pdf bytes', async () => {
    const { controller } = buildController();

    const { res, done } = call(controller);
    await done;

    expect(res.body).toBe(PDF);
  });

  it('responds with a pdf content type and a matching length', async () => {
    const { controller } = buildController();

    const { res, done } = call(controller);
    await done;

    expect(res.headers[httpHeaders.contentType]).toBe('application/pdf');
    expect(res.headers['Content-Length']).toBe(String(PDF.byteLength));
  });

  it('takes the rendering locale from the x-locale header, not the body', async () => {
    const { controller, renderPdf } = buildController();

    // Body says en-US, header says de-DE.
    const { done } = call(controller, {
      body: { template: 'rescueGuide', locale: 'en-US' },
      headers: localeHeaders('de-DE'),
    });
    await done;

    // `PdfService` resolves the locale from the header, so forwarding the body
    // value would silently render the wrong language.
    expect(renderPdf).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en-US' }),
      'de-DE',
    );
  });

  it('rejects a call with no usable locale header', async () => {
    const { controller, renderPdf } = buildController();

    const { done } = call(controller, { headers: {} });

    await expect(done).rejects.toBeInstanceOf(BadRequestException);
    expect(renderPdf).not.toHaveBeenCalled();
  });

  it('lets a renderer failure propagate to the exception filter', async () => {
    const { controller } = buildController(() =>
      Promise.reject(new Error('chromium binary missing')),
    );

    const { done } = call(controller);

    await expect(done).rejects.toThrow('chromium binary missing');
  });

  it('renders under the trace id of the calling hop', async () => {
    let traceSeenInsideRender: string | undefined;
    const { controller, renderPdf } = buildController(async () => {
      traceSeenInsideRender = getTraceId();
      return PDF;
    });

    // core-service forwarded its own trace; document-service must render under
    // that same id, which is what makes the 3-hop chain followable.
    // The handler invokes `renderPdf` synchronously, so the call itself has to
    // be made inside the scope.
    await runWithTrace('caller-hop-trace', async () => {
      await call(controller).done;
    });

    expect(renderPdf).toHaveBeenCalledTimes(1);
    expect(traceSeenInsideRender).toBe('caller-hop-trace');
  });
});
